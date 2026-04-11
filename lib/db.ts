import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

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

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BLOCKED: BlockedData = { dates: [], slots: [], weekdays: [] }

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

// ─── Mobile Charges ───────────────────────────────────────────────────────────

export async function getMobileCharges(): Promise<MobileCharges> {
  return (await redis.get<MobileCharges>('mobile-charges')) ?? DEFAULT_MOBILE_CHARGES
}

export async function setMobileCharges(data: MobileCharges): Promise<void> {
  await redis.set('mobile-charges', data)
}
