import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getCustomers, setCustomers } from '@/lib/db'
import { getTransporter, welcomeEmailHtml } from '@/lib/mailer'

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
