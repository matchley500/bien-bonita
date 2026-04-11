import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'mobile-charges.json')

function read() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf-8')) }
  catch { return { areas: [] } }
}

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(read())
}

export async function PUT(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  // body.areas: { id, label, fee }[]
  const data = { areas: body.areas.map((a: { id: string; label: string; fee: number }) => ({
    id: a.id, label: a.label, fee: Number(a.fee),
  })) }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
  return NextResponse.json(data)
}
