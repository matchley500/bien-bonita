// ─── Slot generation ──────────────────────────────────────────────────────────

// All bookable slots: 8:30 AM – 3:30 PM in 30-min increments
export function buildAllSlots(): string[] {
  const slots: string[] = []
  let h = 8, m = 30
  while (h < 16) {  // stops before 16:00 → last slot is 15:30
    slots.push(`${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`)
    m += 30; if (m === 60) { m = 0; h++ }
  }
  return slots
}

// ─── 2.5-hour buffer ──────────────────────────────────────────────────────────

// Returns the booked slot + the next 4 slots (covers 0–120 min from booking;
// the 150-min / 2.5-hr mark is the first slot that becomes available again).
export function expandWithBuffer(bookedTime: string, allSlots: string[]): string[] {
  const idx = allSlots.indexOf(bookedTime)
  if (idx === -1) return [bookedTime]
  return allSlots.slice(idx, idx + 5)
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

function slotToMinutes(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

// Filters out slots that have already started for the current day
export function filterPastSlots(slots: string[], date: string): string[] {
  if (date !== todayAZ()) return slots
  const now = nowAZMinutes()
  return slots.filter(s => slotToMinutes(s) > now)
}
