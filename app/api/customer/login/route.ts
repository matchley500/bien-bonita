import { NextRequest, NextResponse } from 'next/server'
import { getCustomers } from '@/lib/db'
import { verifyPassword, createCustomerSession } from '@/lib/customers'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const customers = await getCustomers()
  const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase().trim())

  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const token = await createCustomerSession(customer.email)

  const response = NextResponse.json({ ok: true, name: customer.name, email: customer.email })
  response.cookies.set('customer_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}
