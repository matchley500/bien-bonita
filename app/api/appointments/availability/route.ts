import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, getBlocked, getMobileCharges } from '@/lib/db'
import { buildAllSlots, expandWithBuffer, filterPastSlots, isBookableDay } from '@/lib/scheduling'

function dayOfWeek(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).getDay()
}

// Public — returns bookable time slots for a date
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ available: [] })

  // Only Tue-Thu are bookable
  if (!isBookableDay(dayOfWeek(date))) {
    return NextResponse.json({ available: [] })
  }

  const [appointments, blocked, charges] = await Promise.all([
    getAppointments(), getBlocked(), getMobileCharges(),
  ])

  // Fully blocked: specific date or recurring weekday
  if (blocked.dates.includes(date) || blocked.weekdays.includes(dayOfWeek(date))) {
    return NextResponse.json({ available: [] })
  }

  const allSlots = buildAllSlots()

  // Build taken set — each appointment blocks itself + overlapping slots (accounting for travel)
  const taken = new Set<string>()
  for (const appt of appointments.filter(a => a.date === date && a.status !== 'rejected')) {
    const travelMin = appt.locationType === 'mobile'
      ? (charges.areas.find(a => a.label === appt.mobileArea)?.travelMinutes ?? 15)
      : 0
    for (const s of expandWithBuffer(appt.time, allSlots, travelMin)) taken.add(s)
  }
  for (const slot of blocked.slots.filter(s => s.date === date)) {
    taken.add(slot.time)
  }

  const available = filterPastSlots(
    allSlots.filter(s => !taken.has(s)),
    date
  )

  return NextResponse.json({ available })
}
