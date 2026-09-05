import { Redis } from '@upstash/redis'
import { DEFAULT_SLOTS, DEFAULT_MAX_CLIENTS_PER_DAY, DEFAULT_GEL_UPGRADE_PRICE, normalizeSlots } from '@/lib/scheduling'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Appointment {
  id: string
  date: string
  time: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceNames: string
  total: number
  notes: string
  locationType: 'salon' | 'mobile'
  mobileArea: string
  mobileFee: number
  // Client's address for mobile appointments
  address?: string
  createdAt: string
  status?: 'pending_approval' | 'confirmed' | 'done' | 'rejected'
  finalPrice?: number
  rescheduleRequest?: {
    requestedDate: string
    requestedTime: string
    note: string
    createdAt: string
  }
}

export interface BlockedData {
  dates: string[]
  slots: { date: string; time: string }[]
  weekdays: number[] // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
}

export interface MobileArea {
  id: string
  label: string
  fee: number
  travelMinutes?: number // one-way travel time from salon in minutes
}

export interface MobileCharges {
  areas: MobileArea[]
}

export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  category: string
  hasGelUpgrade?: boolean
}

export interface Customer {
  id: string
  email: string
  passwordHash: string
  name: string
  phone?: string
  createdAt: string
  // Accounts created before the approval flow have no status — treat as active
  status?: 'pending' | 'active'
}

export interface Settings {
  bookingOpen: boolean
  salonAddress: string
  // Admin-editable booking schedule.
  // `slots` is the default; `daySlots` overrides it per weekday ("0"=Sun … "6"=Sat).
  slots: string[]
  daySlots?: Record<string, string[]>
  maxClientsPerDay: number
  // Price of the Builder Gel add-on offered on eligible services
  gelUpgradePrice: number
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BLOCKED: BlockedData = { dates: [], slots: [], weekdays: [] }

const DEFAULT_SERVICES: Service[] = [
  { id: '1',  name: 'Dry Manicure',              description: 'Nail shaping, cuticle care, hand massage, and nail polish. Does not include gel polish.',                                    price: 35, duration: '30 min',  category: 'manicure',   hasGelUpgrade: true },
  { id: '3',  name: 'Spa Manicure',              description: 'Relaxing spa manicure with soak, exfoliation, hand massage, and nail polish. Does not include gel polish.',                  price: 40, duration: '45 min',  category: 'manicure',   hasGelUpgrade: true },
  { id: '5',  name: 'Spa Pedicure',              description: 'Relaxing foot soak, exfoliation, massage, and nail polish. Does not include gel polish.',                                     price: 50, duration: '45 min',  category: 'pedicure',   hasGelUpgrade: true },
  { id: '7',  name: 'Gel Polish (Natural Nails)',description: 'Long-lasting gel polish on natural nails.',                                                                                  price: 35, duration: '30 min',  category: 'gel' },
  { id: '8',  name: 'Gel Polish (Toes)',         description: 'Long-lasting gel polish on toenails.',                                                                                       price: 40, duration: '30 min',  category: 'gel' },
  { id: '9',  name: 'Gel-X — Short (S)',         description: 'Full set of Gel-X nail extensions, short length. Includes gel polish. Base price for a 3-week treatment.',                  price: 50, duration: '75 min',  category: 'extensions' },
  { id: '10', name: 'Gel-X — Medium (M)',        description: 'Full set of Gel-X nail extensions, medium length. Includes gel polish. Base price for a 3-week treatment.',                 price: 60, duration: '90 min',  category: 'extensions' },
  { id: '11', name: 'Gel-X — Long (L)',          description: 'Full set of Gel-X nail extensions, long length. Includes gel polish. Base price for a 3-week treatment.',                   price: 70, duration: '90 min',  category: 'extensions' },
  { id: '12', name: 'Gel-X — XL',               description: 'Full set of Gel-X nail extensions, extra long length. Includes gel polish. Base price for a 3-week treatment.',              price: 80, duration: '105 min', category: 'extensions' },
  { id: '13', name: 'Builder Gel (Natural Nail)',description: 'Strengthening builder gel applied over natural nails for added length and durability. Includes gel polish.',                 price: 40, duration: '60 min',  category: 'extensions' },
  { id: '14', name: 'Builder Gel Fill',          description: 'Fill and refresh for existing builder gel. Includes gel polish.',                                                             price: 45, duration: '60 min',  category: 'extensions' },
  { id: '15', name: 'Acrylic Toes',              description: 'Acrylic applied to the big toes only for added strength and shape. $7.50 per toe — $15 for both.',                          price: 15, duration: '30 min',  category: 'pedicure' },
  { id: '16', name: 'Foreign Removal',           description: 'Safe removal of nail products applied by another salon.',                                                                    price: 20, duration: '30 min',  category: 'removals' },
  { id: '17', name: 'Acrylic Removal',           description: 'Safe and gentle removal of acrylic nails.',                                                                                  price: 25, duration: '30 min',  category: 'removals' },
  { id: '18', name: 'Nail Fix',                  description: 'Repair a broken or damaged nail.',                                                                                           price: 5,  duration: '10 min',  category: 'addons' },
  { id: '19', name: 'Design — French',           description: 'Classic French tip design.',                                                                                                 price: 10, duration: '10 min',  category: 'designs' },
  { id: '20', name: 'Design — Level 1',          description: 'Simple nail art design (e.g. solid accents, basic patterns).',                                                               price: 10, duration: '15 min',  category: 'designs' },
  { id: '21', name: 'Design — Level 2',          description: 'Intermediate nail art design (e.g. florals, gradients, foils).',                                                             price: 15, duration: '20 min',  category: 'designs' },
  { id: '22', name: 'Design — Level 3',          description: 'Detailed nail art design (e.g. intricate patterns, chrome, embellishments).',                                                price: 20, duration: '25 min',  category: 'designs' },
  { id: '23', name: 'Design — Level 4',          description: 'Premium custom nail art (e.g. 3D art, hand-painted scenes, complex characters).',                                            price: 35, duration: '40 min',  category: 'designs' },
]

const DEFAULT_MOBILE_CHARGES: MobileCharges = {
  areas: [
    { id: 'in-town',                 label: 'In Town',                   fee: 10, travelMinutes: 15 },
    { id: 'vail-rita-ranch',         label: 'Vail / Rita Ranch',         fee: 20, travelMinutes: 25 },
    { id: 'north-tucson-oro-valley', label: 'North Tucson / Oro Valley', fee: 25, travelMinutes: 35 },
  ],
}

const DEFAULT_SETTINGS: Settings = {
  bookingOpen: false,
  salonAddress: '',
  slots: [...DEFAULT_SLOTS],
  maxClientsPerDay: DEFAULT_MAX_CLIENTS_PER_DAY,
  gelUpgradePrice: DEFAULT_GEL_UPGRADE_PRICE,
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointments(): Promise<Appointment[]> {
  return (await redis.get<Appointment[]>('appointments')) ?? []
}

export async function setAppointments(data: Appointment[]): Promise<void> {
  await redis.set('appointments', data)
}

// ─── Blocked ──────────────────────────────────────────────────────────────────

export async function getBlocked(): Promise<BlockedData> {
  const raw = await redis.get<BlockedData>('blocked')
  if (!raw) return DEFAULT_BLOCKED
  return {
    dates:    raw.dates    ?? [],
    slots:    raw.slots    ?? [],
    weekdays: raw.weekdays ?? [],
  }
}

export async function setBlocked(data: BlockedData): Promise<void> {
  await redis.set('blocked', data)
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
  return (await redis.get<Service[]>('services')) ?? DEFAULT_SERVICES
}

export async function setServices(data: Service[]): Promise<void> {
  await redis.set('services', data)
}

// ─── Mobile Charges ───────────────────────────────────────────────────────────

export async function getMobileCharges(): Promise<MobileCharges> {
  const raw = await redis.get<MobileCharges>('mobile-charges')
  if (!raw) return DEFAULT_MOBILE_CHARGES
  // Ensure travelMinutes is present (backwards compat)
  return {
    areas: raw.areas.map(a => ({
      ...a,
      travelMinutes: a.travelMinutes ?? DEFAULT_MOBILE_CHARGES.areas.find(d => d.id === a.id)?.travelMinutes ?? 15,
    })),
  }
}

export async function setMobileCharges(data: MobileCharges): Promise<void> {
  await redis.set('mobile-charges', data)
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<Customer[]> {
  return (await redis.get<Customer[]>('customers')) ?? []
}

export async function setCustomers(data: Customer[]): Promise<void> {
  await redis.set('customers', data)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  const raw = await redis.get<Settings>('settings')
  // Merge with defaults so settings saved before new fields existed stay valid
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) }
  const slots = normalizeSlots(merged.slots)

  // Per-day overrides: normalize each day's list, keeping empty lists as-is
  // (an empty list means that day has no bookable times)
  let daySlots: Record<string, string[]> | undefined
  if (merged.daySlots && typeof merged.daySlots === 'object') {
    daySlots = {}
    for (const [dow, list] of Object.entries(merged.daySlots)) {
      if (!/^[0-6]$/.test(dow)) continue
      daySlots[dow] = Array.isArray(list) ? normalizeSlots(list) : []
    }
    if (Object.keys(daySlots).length === 0) daySlots = undefined
  }

  return {
    ...merged,
    // Never leave the salon with zero bookable times
    slots: slots.length ? slots : [...DEFAULT_SLOTS],
    daySlots,
    maxClientsPerDay:
      Number.isFinite(merged.maxClientsPerDay) && merged.maxClientsPerDay > 0
        ? Math.floor(merged.maxClientsPerDay)
        : DEFAULT_MAX_CLIENTS_PER_DAY,
    gelUpgradePrice:
      Number.isFinite(merged.gelUpgradePrice) && merged.gelUpgradePrice >= 0
        ? merged.gelUpgradePrice
        : DEFAULT_GEL_UPGRADE_PRICE,
  }
}

export async function setSettings(data: Settings): Promise<void> {
  await redis.set('settings', data)
}
