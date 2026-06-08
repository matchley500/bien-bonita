import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, setAppointments } from '@/lib/db'
import { getTransporter, rescheduleReceivedEmailHtml, rescheduleAdminEmailHtml } from '@/lib/mailer'
import { buildAllSlots } from '@/lib/scheduling'

function fmtTime(val: string) {
  const [hStr, mStr] = val.split(':')
  const h = parseInt(hStr)
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dh}:${mStr} ${period}`
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, currentDate, requestedDate, requestedTime, note } = body

  if (!email || !currentDate || !requestedDate || !requestedTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate requested time is a valid slot
  const allSlots = buildAllSlots()
  if (!allSlots.includes(requestedTime)) {
    return NextResponse.json({ error: 'Invalid requested time' }, { status: 400 })
  }

  const appointments = await getAppointments()

  // Find the appointment by email + current date (most recent match)
  const idx = appointments.findIndex(
    a => a.customerEmail?.toLowerCase() === email.toLowerCase()
      && a.date === currentDate
      && a.status !== 'done'
  )

  if (idx === -1) {
    return NextResponse.json(
      { error: 'No matching appointment found. Please check your email and appointment date.' },
      { status: 404 }
    )
  }

  const appt = appointments[idx]

  // Store the request on the appointment
  appointments[idx] = {
    ...appt,
    rescheduleRequest: {
      requestedDate,
      requestedTime,
      note: note || '',
      createdAt: new Date().toISOString(),
    },
  }
  await setAppointments(appointments)

  const adminEmail = process.env.GMAIL_USER
  if (adminEmail && process.env.GMAIL_APP_PASSWORD) {
    const transporter = getTransporter()

    // Notify admin
    try {
      await transporter.sendMail({
        from: `"Bien Bonita Nails & Spa" <${adminEmail}>`,
        to: adminEmail,
        subject: `Reschedule Request from ${appt.customerName}`,
        html: rescheduleAdminEmailHtml({
          customerName: appt.customerName,
          customerEmail: appt.customerEmail,
          customerPhone: appt.customerPhone,
          currentDate: appt.date,
          currentTime: fmtTime(appt.time),
          requestedDate,
          requestedTime: fmtTime(requestedTime),
          note,
        }),
      })
    } catch (err) { console.error('Admin reschedule email failed:', err) }

    // Confirm to customer
    if (appt.customerEmail) {
      try {
        await transporter.sendMail({
          from: `"Bien Bonita Nails & Spa" <${adminEmail}>`,
          to: appt.customerEmail,
          subject: `We received your reschedule request ✨`,
          html: rescheduleReceivedEmailHtml({
            customerName: appt.customerName,
            currentDate: appt.date,
            currentTime: fmtTime(appt.time),
            requestedDate,
            requestedTime: fmtTime(requestedTime),
            note,
          }),
        })
      } catch (err) { console.error('Customer reschedule email failed:', err) }
    }
  }

  return NextResponse.json({ ok: true })
}
