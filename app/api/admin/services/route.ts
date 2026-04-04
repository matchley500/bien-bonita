import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'services.json')

function readServices() {
  const data = fs.readFileSync(dataPath, 'utf-8')
  return JSON.parse(data)
}

function writeServices(services: unknown[]) {
  fs.writeFileSync(dataPath, JSON.stringify(services, null, 2))
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifySession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const services = readServices()

  const newService = {
    id: String(Date.now()),
    name: body.name,
    description: body.description,
    price: Number(body.price),
    duration: body.duration,
    category: body.category,
  }

  services.push(newService)
  writeServices(services)

  return NextResponse.json(newService, { status: 201 })
}
