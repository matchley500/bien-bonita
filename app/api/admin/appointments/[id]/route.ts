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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const appointments = readAppointments()
  const filtered = appointments.filter((a: { id: string }) => a.id !== id)
  writeAppointments(filtered)

  return NextResponse.json({ success: true })
}
