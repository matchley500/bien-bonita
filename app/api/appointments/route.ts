import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, setAppointments } from '@/lib/db'

// Public — customers submit booking requests
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, time, customerName, customerEmail, customerPhone, serviceNames, total, notes } = body

  if (!date || !time || !customerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const appointments = await getAppointments()

  // Check if the slot is already taken
  const conflict = appointments.find(a => a.date === date && a.time === time)
  if (conflict) {
    return NextResponse.json({ error: 'That time slot is no longer available.' }, { status: 409 })
  }

  const newAppointment = {
    id: String(Date.now()),
    date,
    time,
    customerName,
    customerEmail,
    customerPhone,
    serviceNames,
    total,
    notes: notes || '',
    locationType: body.locationType || 'salon',
    mobileArea: body.mobileArea || '',
    mobileFee: Number(body.mobileFee) || 0,
    createdAt: new Date().toISOString(),
  }

  appointments.push(newAppointment)
  await setAppointments(appointments)

  return NextResponse.json(newAppointment, { status: 201 })
}
