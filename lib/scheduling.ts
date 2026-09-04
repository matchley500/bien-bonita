// ─── Booking constraints ───────────────────────────────────────────────────────

// Which days are bookable is controlled by the admin via the Availability tab
// (recurring weekday blocks) — no days are hardcoded off here.
export const MAX_CLIENTS_PER_DAY = 3

// Fixed appointment slots: 9:30 AM, 12:00 PM, 2:30 PM
const FIXED_SLOTS = ['09:30', '12:00', '14:30']

export function buildAllSlots(): string[] {
  return [...FIXED_SLOTS]
}

// ─── Slot blocking ─────────────────────────────────────────────────────────────

function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

// Returns all slots that overlap a 2-hour appointment + travel (both ways) + 30-min grace.
// travelMinutes = one-way travel time. Total blocked = 2h + (travelMinutes × 2) + 30min.
export function expandWithBuffer(bookedTime: string, allSlots: string[], travelOneWayMinutes = 0): string[] {
  const blockedDuration = 120 + travelOneWayMinutes * 2 + 30
  const startMin = slotToMinutes(bookedTime)
  return allSlots.filter(s => {
    const sMin = slotToMinutes(s)
    return sMin >= startMin && sMin < startMin + blockedDuration
  })
}

// ─── Arizona time helpers (UTC-7, no DST) ─────────────────────────────────────

export function todayAZ(): string {
  const az = new Date(Date.now() - 7 * 60 * 60 * 1000)
  return az.toISOString().split('T')[0]
}

function nowAZMinutes(): number {
  const az = new Date(Date.now() - 7 * 60 * 60 * 1000)
  return az.getUTCHours() * 60 + az.getUTCMinutes()
}

export function filterPastSlots(slots: string[], date: string): string[] {
  if (date !== todayAZ()) return slots
  const now = nowAZMinutes()
  return slots.filter(s => slotToMinutes(s) > now)
}
