// ─── Booking constraints ───────────────────────────────────────────────────────
//
// Bookable days, slot times, and the daily client cap are all admin-editable
// (Settings → Booking Schedule). These are only the fallbacks used before any
// settings have been saved.

export const DEFAULT_SLOTS = ['09:30', '12:00', '14:30']
export const DEFAULT_MAX_CLIENTS_PER_DAY = 3
export const DEFAULT_GEL_UPGRADE_PRICE = 15

// ─── Slot helpers ──────────────────────────────────────────────────────────────

export function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

// "09:30" → "9:30 AM". Works for any time, not just the configured slots, so
// appointments booked under an older schedule still display correctly.
export function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return slot
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${period}`
}

// Appointment times for a given weekday (0=Sun … 6=Sat).
// A day with its own list uses it — including an empty list, which means the
// day has no bookable times. Days never customized fall back to the default.
export function slotsForDayOfWeek(
  settings: { slots: string[]; daySlots?: Record<string, string[]> },
  dow: number
): string[] {
  return settings.daySlots?.[String(dow)] ?? settings.slots
}

// Normalizes stored slots: valid HH:MM only, de-duplicated, chronological
export function normalizeSlots(slots: unknown): string[] {
  if (!Array.isArray(slots)) return [...DEFAULT_SLOTS]
  const valid = slots
    .filter((s): s is string => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s))
    .filter(s => {
      const [h, m] = s.split(':').map(Number)
      return h >= 0 && h <= 23 && m >= 0 && m <= 59
    })
  const unique = Array.from(new Set(valid))
  return unique.sort((a, b) => slotToMinutes(a) - slotToMinutes(b))
}

// ─── Slot blocking ─────────────────────────────────────────────────────────────

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
