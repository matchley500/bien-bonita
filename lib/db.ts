import { Redis } from '@upstash/redis'

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
  createdAt: string
}

export interface BlockedData {
  dates: string[]
  slots: { date: string; time: string }[]
  weekdays: number[] // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
}

export interface MobileCharges {
  areas: { id: string; label: string; fee: number }[]
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
    { id: 'in-town',                  label: 'In Town',                  fee: 10 },
    { id: 'vail-rita-ranch',          label: 'Vail / Rita Ranch',        fee: 20 },
    { id: 'north-tucson-oro-valley',  label: 'North Tucson / Oro Valley', fee: 25 },
  ],
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
  return (await redis.get<MobileCharges>('mobile-charges')) ?? DEFAULT_MOBILE_CHARGES
}

export async function setMobileCharges(data: MobileCharges): Promise<void> {
  await redis.set('mobile-charges', data)
}
