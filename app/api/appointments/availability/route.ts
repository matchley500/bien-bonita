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

  const taken = new Set([
    ...appointments.filter(a => a.date === date).map(a => a.time),
    ...blocked.slots.filter(s => s.date === date).map(s => s.time),
  ])

  const available = buildAllSlots().filter(s => !taken.has(s))
  return NextResponse.json({ available })
}
