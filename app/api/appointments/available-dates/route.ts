import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, getBlocked } from '@/lib/db'
import { buildAllSlots, expandWithBuffer, filterPastSlots } from '@/lib/scheduling'

// Public — returns YYYY-MM-DD strings in a month that have no bookable slots
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') // "YYYY-MM"
  if (!month) return NextResponse.json({ unavailable: [] })

  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr)
  const mo = parseInt(monthStr)
  const daysInMonth = new Date(year, mo, 0).getDate()
  const allSlots = buildAllSlots()

  const [appointments, blocked] = await Promise.all([getAppointments(), getBlocked()])

  const unavailable: string[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(year, mo - 1, d).getDay()

    // Blocked by specific date or recurring weekday
    if (blocked.dates.includes(date) || blocked.weekdays.includes(dow)) {
      unavailable.push(date)
      continue
    }

    // Build taken set with 2.5-hr buffer per appointment
    const taken = new Set<string>()
    for (const appt of appointments.filter(a => a.date === date)) {
      for (const s of expandWithBuffer(appt.time, allSlots)) taken.add(s)
    }
    for (const slot of blocked.slots.filter(s => s.date === date)) {
      taken.add(slot.time)
    }

    // For today: remove past slots before checking if any remain
    const remaining = filterPastSlots(
      allSlots.filter(s => !taken.has(s)),
      date
    )

    if (remaining.length === 0) unavailable.push(date)
  }

  return NextResponse.json({ unavailable })
}
