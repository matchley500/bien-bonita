import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, setCustomers } from '@/lib/db'
import { hashPassword } from '@/lib/customers'
import { getTransporter, newAccountAdminEmailHtml } from '@/lib/mailer'

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const customers = await getCustomers()
  const exists = customers.some(c => c.email.toLowerCase() === email.toLowerCase())
  if (exists) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const newCustomer = {
    id: String(Date.now()),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }

  customers.push(newCustomer)
  await setCustomers(customers)

  // Notify admin of the new account (non-fatal if email fails)
  const adminEmail = process.env.GMAIL_USER
  if (adminEmail && process.env.GMAIL_APP_PASSWORD) {
    try {
      await getTransporter().sendMail({
        from: `"Bien Bonita Website" <${adminEmail}>`,
        to: adminEmail,
        subject: `New client account: ${newCustomer.name}`,
        html: newAccountAdminEmailHtml({
          name: newCustomer.name,
          email: newCustomer.email,
          createdAt: newCustomer.createdAt,
        }),
      })
    } catch (err) { console.error('New account admin email failed:', err) }
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
