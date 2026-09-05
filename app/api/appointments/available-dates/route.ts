import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, getBlocked, getMobileCharges, getSettings } from '@/lib/db'
import { expandWithBuffer, filterPastSlots, slotsForDayOfWeek } from '@/lib/scheduling'

// Public — returns YYYY-MM-DD strings in a month that have no bookable slots
export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') // "YYYY-MM"
  if (!month) return NextResponse.json({ unavailable: [] })

  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr)
  const mo = parseInt(monthStr)
  const daysInMonth = new Date(year, mo, 0).getDate()

  const [appointments, blocked, charges, settings] = await Promise.all([
    getAppointments(), getBlocked(), getMobileCharges(), getSettings(),
  ])

  const unavailable: string[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(year, mo - 1, d).getDay()

    // Blocked by specific date or recurring weekday
    if (blocked.dates.includes(date) || blocked.weekdays.includes(dow)) {
      unavailable.push(date)
      continue
    }

    // This weekday's appointment times (may differ day to day)
    const allSlots = slotsForDayOfWeek(settings, dow)
    if (allSlots.length === 0) {
      unavailable.push(date)
      continue
    }

    const dayAppts = appointments.filter(a => a.date === date && a.status !== 'rejected')

    // Max clients reached
    if (dayAppts.length >= settings.maxClientsPerDay) {
      unavailable.push(date)
      continue
    }

    // Build taken set with travel-aware buffer per appointment
    const taken = new Set<string>()
    for (const appt of dayAppts) {
      const travelMin = appt.locationType === 'mobile'
        ? (charges.areas.find(a => a.label === appt.mobileArea)?.travelMinutes ?? 15)
        : 0
      for (const s of expandWithBuffer(appt.time, allSlots, travelMin)) taken.add(s)
    }
    for (const slot of blocked.slots.filter(s => s.date === date)) {
      taken.add(slot.time)
    }

    const remaining = filterPastSlots(allSlots.filter(s => !taken.has(s)), date)
    if (remaining.length === 0) unavailable.push(date)
  }

  return NextResponse.json({ unavailable })
}
