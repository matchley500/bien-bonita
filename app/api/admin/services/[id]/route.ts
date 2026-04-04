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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifySession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const services = readServices()
  const index = services.findIndex((s: { id: string }) => s.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  services[index] = {
    ...services[index],
    name: body.name ?? services[index].name,
    description: body.description ?? services[index].description,
    price: body.price !== undefined ? Number(body.price) : services[index].price,
    duration: body.duration ?? services[index].duration,
    category: body.category ?? services[index].category,
  }

  writeServices(services)
  return NextResponse.json(services[index])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifySession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const services = readServices()
  const filtered = services.filter((s: { id: string }) => s.id !== id)

  if (filtered.length === services.length) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  writeServices(filtered)
  return NextResponse.json({ success: true })
}
