import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, getBlocked } from '@/lib/db'
import { buildAllSlots, expandWithBuffer, filterPastSlots } from '@/lib/scheduling'

function dayOfWeek(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).getDay()
}

// Public — returns bookable time slots for a date
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ available: [] })

  const [appointments, blocked] = await Promise.all([getAppointments(), getBlocked()])

  // Fully blocked: specific date or recurring weekday
  if (blocked.dates.includes(date) || blocked.weekdays.includes(dayOfWeek(date))) {
    return NextResponse.json({ available: [] })
  }

  const allSlots = buildAllSlots()

  // Build taken set — each appointment blocks itself + next 4 slots (2.5 hr buffer)
  const taken = new Set<string>()
  for (const appt of appointments.filter(a => a.date === date)) {
    for (const s of expandWithBuffer(appt.time, allSlots)) taken.add(s)
  }
  for (const slot of blocked.slots.filter(s => s.date === date)) {
    taken.add(slot.time)
  }

  // Filter unavailable slots, then remove past slots if this is today
  const available = filterPastSlots(
    allSlots.filter(s => !taken.has(s)),
    date
  )

  return NextResponse.json({ available })
}
