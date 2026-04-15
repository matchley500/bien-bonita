import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getServices, setServices } from '@/lib/db'

export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const services = await getServices()

  const newService = {
    id: String(Date.now()),
    name: body.name,
    description: body.description,
    price: Number(body.price),
    duration: body.duration,
    category: body.category,
  }

  services.push(newService)
  await setServices(services)

  return NextResponse.json(newService, { status: 201 })
}
