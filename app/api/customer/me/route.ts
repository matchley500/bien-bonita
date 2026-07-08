import { NextResponse } from 'next/server'
import { getCustomers, getAppointments } from '@/lib/db'
import { verifyCustomerSession } from '@/lib/customers'

export async function GET() {
  const email = await verifyCustomerSession()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [customers, appointments] = await Promise.all([getCustomers(), getAppointments()])

  const customer = customers.find(c => c.email === email)
  if (!customer) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const myAppointments = appointments
    .filter(a => a.customerEmail?.toLowerCase() === email.toLowerCase() && a.status !== 'rejected')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))

  return NextResponse.json({
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? '',
    appointments: myAppointments,
  })
}
