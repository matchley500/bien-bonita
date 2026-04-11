import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getBlocked, setBlocked } from '@/lib/db'

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getBlocked())
}

// Body:
//   { type: 'date',    date: string }
//   { type: 'slot',    date: string, time: string }
//   { type: 'weekday', day: number }   ← 0–6
export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const data = await getBlocked()

  if (body.type === 'date') {
    if (!data.dates.includes(body.date)) data.dates.push(body.date)
  } else if (body.type === 'slot') {
    const exists = data.slots.some(s => s.date === body.date && s.time === body.time)
    if (!exists) data.slots.push({ date: body.date, time: body.time })
  } else if (body.type === 'weekday') {
    if (!data.weekdays.includes(body.day)) data.weekdays.push(body.day)
  }

  await setBlocked(data)
  return NextResponse.json(data)
}

// Body same shape as POST — removes the matching entry
export async function DELETE(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const data = await getBlocked()

  if (body.type === 'date') {
    data.dates = data.dates.filter(d => d !== body.date)
  } else if (body.type === 'slot') {
    data.slots = data.slots.filter(s => !(s.date === body.date && s.time === body.time))
  } else if (body.type === 'weekday') {
    data.weekdays = data.weekdays.filter(d => d !== body.day)
  }

  await setBlocked(data)
  return NextResponse.json(data)
}
