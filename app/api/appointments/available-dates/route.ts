import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, getBlocked } from '@/lib/db'

function buildAllSlots(): string[] {
  const slots: string[] = []
  let h = 8, m = 30
  while (h < 16 || (h === 16 && m === 0)) {
    slots.push(`${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`)
    m += 30; if (m === 60) { m = 0; h++ }
  }
  return slots
}

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

    // Fully booked (all slots taken or individually blocked)
    const taken = new Set([
      ...appointments.filter(a => a.date === date).map(a => a.time),
      ...blocked.slots.filter(s => s.date === date).map(s => s.time),
    ])
    if (taken.size >= allSlots.length) unavailable.push(date)
  }

  return NextResponse.json({ unavailable })
}
