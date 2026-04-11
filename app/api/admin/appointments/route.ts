import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'appointments.json')

function readAppointments() {
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  } catch {
    return []
  }
}

function writeAppointments(appointments: unknown[]) {
  fs.writeFileSync(dataPath, JSON.stringify(appointments, null, 2))
}

// Admin — view all appointments
export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(readAppointments())
}

// Admin — manually add an appointment
export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const appointments = readAppointments()

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
    createdAt: new Date().toISOString(),
  }

  appointments.push(newAppointment)
  writeAppointments(appointments)

  return NextResponse.json(newAppointment, { status: 201 })
}
