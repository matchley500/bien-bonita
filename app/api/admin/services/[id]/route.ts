import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getServices, setServices } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const services = await getServices()
  const index = services.findIndex(s => s.id === id)

  if (index === -1) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  services[index] = {
    ...services[index],
    name:        body.name        ?? services[index].name,
    description: body.description ?? services[index].description,
    price:       body.price !== undefined ? Number(body.price) : services[index].price,
    duration:    body.duration    ?? services[index].duration,
    category:    body.category    ?? services[index].category,
  }

  await setServices(services)
  return NextResponse.json(services[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const services = await getServices()
  const filtered = services.filter(s => s.id !== id)

  if (filtered.length === services.length) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  await setServices(filtered)
  return NextResponse.json({ success: true })
}
