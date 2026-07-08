import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getCustomers } from '@/lib/db'

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const customers = await getCustomers()
  // Never expose password hashes to the client
  return NextResponse.json(customers.map(({ passwordHash: _ph, ...c }) => c))
}
