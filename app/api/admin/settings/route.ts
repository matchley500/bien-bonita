import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getSettings, setSettings } from '@/lib/db'

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getSettings())
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const current = await getSettings()
  const updated = { ...current, ...body }
  await setSettings(updated)
  return NextResponse.json(updated)
}
