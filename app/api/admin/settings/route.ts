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

  if (body.daySlots !== undefined) {
    if (typeof body.daySlots !== 'object' || body.daySlots === null) {
      return NextResponse.json({ error: 'Invalid per-day hours.' }, { status: 400 })
    }
    const cleaned: Record<string, string[]> = {}
    for (const [dow, list] of Object.entries(body.daySlots)) {
      if (!/^[0-6]$/.test(dow)) continue
      // An empty list is allowed — it means that day has no bookable times
      cleaned[dow] = normalizeSlots(list)
    }
    updated.daySlots = cleaned
  }

  if (body.maxClientsPerDay !== undefined) {
    const max = Number(body.maxClientsPerDay)
    if (!Number.isFinite(max) || max < 1) {
      return NextResponse.json({ error: 'Max clients per day must be at least 1.' }, { status: 400 })
    }
    updated.maxClientsPerDay = Math.floor(max)
  }

  if (body.gelUpgradePrice !== undefined) {
    const price = Number(body.gelUpgradePrice)
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: 'Builder gel upgrade price must be 0 or more.' }, { status: 400 })
    }
    updated.gelUpgradePrice = price
  }

  await setSettings(updated)
  return NextResponse.json(updated)
}
