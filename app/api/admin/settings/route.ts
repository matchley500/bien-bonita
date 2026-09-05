import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getSettings, setSettings } from '@/lib/db'
import { normalizeSlots } from '@/lib/scheduling'

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getSettings())
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const current = await getSettings()
  const updated = { ...current, ...body }

  if (body.slots !== undefined) {
    const slots = normalizeSlots(body.slots)
    if (slots.length === 0) {
      return NextResponse.json({ error: 'Add at least one appointment time.' }, { status: 400 })
    }
    updated.slots = slots
  }

  if (body.maxClientsPerDay !== undefined) {
    const max = Number(body.maxClientsPerDay)
    if (!Number.isFinite(max) || max < 1) {
      return NextResponse.json({ error: 'Max clients per day must be at least 1.' }, { status: 400 })
    }
    updated.maxClientsPerDay = Math.floor(max)
  }

  await setSettings(updated)
  return NextResponse.json(updated)
}
