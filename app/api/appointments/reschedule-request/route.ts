import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, setAppointments, getSettings } from '@/lib/db'
import { sendMail, rescheduleReceivedEmailHtml, rescheduleAdminEmailHtml } from '@/lib/mailer'
import { formatSlotLabel as fmtTime, slotsForDayOfWeek } from '@/lib/scheduling'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, currentDate, requestedDate, requestedTime, note } = body

  if (!email || !currentDate || !requestedDate || !requestedTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate the requested time against that weekday's schedule
  const settings = await getSettings()
  const [ry, rm, rd] = requestedDate.split('-').map(Number)
  const requestedDow = new Date(ry, rm - 1, rd).getDay()
  if (!slotsForDayOfWeek(settings, requestedDow).includes(requestedTime)) {
    return NextResponse.json({ error: 'That time is not available on the requested day.' }, { status: 400 })
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

    // Notify admin
    try {
      await sendMail({
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
        await sendMail({
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
