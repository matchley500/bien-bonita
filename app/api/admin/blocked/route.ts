import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'blocked.json')

interface BlockedData {
  dates: string[]
  slots: { date: string; time: string }[]
  weekdays: number[] // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
}

function read(): BlockedData {
  try {
    const d = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    return { dates: d.dates ?? [], slots: d.slots ?? [], weekdays: d.weekdays ?? [] }
  } catch { return { dates: [], slots: [], weekdays: [] } }
}

function write(data: BlockedData) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(read())
}

// Body:
//   { type: 'date',    date: string }
//   { type: 'slot',    date: string, time: string }
//   { type: 'weekday', day: number }   ← 0–6
export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const data = read()

  if (body.type === 'date') {
    if (!data.dates.includes(body.date)) data.dates.push(body.date)
  } else if (body.type === 'slot') {
    const exists = data.slots.some(s => s.date === body.date && s.time === body.time)
    if (!exists) data.slots.push({ date: body.date, time: body.time })
  } else if (body.type === 'weekday') {
    if (!data.weekdays.includes(body.day)) data.weekdays.push(body.day)
  }

  write(data)
  return NextResponse.json(data)
}

// Body same shape as POST — removes the matching entry
export async function DELETE(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const data = read()

  if (body.type === 'date') {
    data.dates = data.dates.filter(d => d !== body.date)
  } else if (body.type === 'slot') {
    data.slots = data.slots.filter(s => !(s.date === body.date && s.time === body.time))
  } else if (body.type === 'weekday') {
    data.weekdays = data.weekdays.filter(d => d !== body.day)
  }

  write(data)
  return NextResponse.json(data)
}
