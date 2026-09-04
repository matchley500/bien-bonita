import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getCustomers } from '@/lib/db'
import { sendMail, announcementEmailHtml } from '@/lib/mailer'

// Send an admin-drafted announcement to every active client
export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, message } = await request.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: 'Email is not configured.' }, { status: 500 })
  }

  const customers = await getCustomers()
  const recipients = customers.filter(c => c.status !== 'pending')
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No active clients to email.' }, { status: 400 })
  }

  let sent = 0
  const failed: string[] = []
  for (const customer of recipients) {
    try {
      await sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: customer.email,
        subject: subject.trim(),
        html: announcementEmailHtml({ name: customer.name, message: message.trim() }),
      })
      sent++
    } catch (err) {
      console.error(`Announcement to ${customer.email} failed:`, err)
      failed.push(customer.email)
    }
  }

  return NextResponse.json({ sent, failed })
}
