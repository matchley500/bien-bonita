import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getMobileCharges, setMobileCharges } from '@/lib/db'

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getMobileCharges())
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const data = {
    areas: body.areas.map((a: { id: string; label: string; fee: number }) => ({
      id: a.id, label: a.label, fee: Number(a.fee),
    })),
  }
  await setMobileCharges(data)
  return NextResponse.json(data)
}
