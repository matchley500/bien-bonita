import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { verifySession } from '@/lib/auth'
import { getCustomers, setCustomers } from '@/lib/db'
import { hashPassword } from '@/lib/customers'
import { getTransporter, welcomeEmailHtml, passwordResetEmailHtml } from '@/lib/mailer'

// Readable charset — no ambiguous characters (0/O, 1/l/I)
function generateTempPassword(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(length)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

// Approve an account request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const customers = await getCustomers()
  const index = customers.findIndex(c => c.id === id)

  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const previous = customers[index]
  customers[index] = { ...previous, status: body.status }
  await setCustomers(customers)

  // Newly approved → send welcome email to the customer
  if (
    body.status === 'active' &&
    previous.status === 'pending' &&
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ) {
    try {
      await getTransporter().sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: previous.email,
        subject: `Welcome to Bien Bonita Nails & Spa ✨`,
        html: welcomeEmailHtml({ name: previous.name }),
      })
    } catch (err) { console.error('Welcome email failed:', err) }
  }

  const { passwordHash: _ph, ...safe } = customers[index]
  return NextResponse.json(safe)
}

// Reset a customer's password — generates a temp password and emails it to them
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const customers = await getCustomers()
  const index = customers.findIndex(c => c.id === id)

  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const customer = customers[index]
  const tempPassword = generateTempPassword()
  customers[index] = { ...customer, passwordHash: hashPassword(tempPassword) }
  await setCustomers(customers)

  let emailed = false
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await getTransporter().sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: customer.email,
        subject: 'Your Bien Bonita password has been reset',
        html: passwordResetEmailHtml({ name: customer.name, tempPassword }),
      })
      emailed = true
    } catch (err) { console.error('Password reset email failed:', err) }
  }

  // Return the temp password so the admin can share it manually if email failed
  return NextResponse.json({ ok: true, emailed, tempPassword })
}

// Deny an account request — removes it so the person can re-register later
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const customers = await getCustomers()
  const filtered = customers.filter(c => c.id !== id)

  if (filtered.length === customers.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await setCustomers(filtered)
  return NextResponse.json({ ok: true })
}
