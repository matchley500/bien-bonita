import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAppointments, setAppointments } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const appointments = await getAppointments()
  const index = appointments.findIndex(a => a.id === id)

  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  appointments[index] = { ...appointments[index], ...body }
  await setAppointments(appointments)

  return NextResponse.json(appointments[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const appointments = await getAppointments()
  const filtered = appointments.filter(a => a.id !== id)
  await setAppointments(filtered)

  return NextResponse.json({ success: true })
}
