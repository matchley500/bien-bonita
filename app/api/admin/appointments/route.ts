import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAppointments, setAppointments } from '@/lib/db'

// Admin — view all appointments
export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAppointments())
}

// Admin — manually add an appointment
export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const appointments = await getAppointments()

  const newAppointment = {
    id: String(Date.now()),
    date: body.date,
    time: body.time,
    customerName: body.customerName,
    customerEmail: body.customerEmail || '',
    customerPhone: body.customerPhone || '',
    serviceNames: body.serviceNames || '',
    total: Number(body.total) || 0,
    notes: body.notes || '',
    locationType: 'salon' as const,
    mobileArea: '',
    mobileFee: 0,
    createdAt: new Date().toISOString(),
  }

  appointments.push(newAppointment)
  await setAppointments(appointments)

  return NextResponse.json(newAppointment, { status: 201 })
}
