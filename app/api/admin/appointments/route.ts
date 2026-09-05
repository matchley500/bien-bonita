import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAppointments, setAppointments, getSettings } from '@/lib/db'
import { sendMail, confirmationEmailHtml, generateICS } from '@/lib/mailer'
import { formatSlotLabel as fmtTime } from '@/lib/scheduling'

// Admin — view all appointments
export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getAppointments())
}

// Admin — manually add an appointment
export async function POST(request: NextRequest) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const appointments = await getAppointments()

  const newAppointment = {
    id: String(Date.now()),
    date: body.date,
    time: body.time,
    customerName: body.customerName,
    customerEmail: body.customerEmail || '',
    customerPhone: body.customerPhone || '',
    serviceNames: body.serviceNames || '',
    total: Number(body.total) || 0,
    notes: body.notes || '',
    locationType: 'salon' as const,
    mobileArea: '',
    mobileFee: 0,
    createdAt: new Date().toISOString(),
    // Booked by the admin directly, so it's confirmed from the start
    status: 'confirmed' as const,
  }

  appointments.push(newAppointment)
  await setAppointments(appointments)

  // Optionally email the client their confirmation + calendar invite
  let emailed = false
  if (
    body.notifyCustomer === true &&
    newAppointment.customerEmail &&
    process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ) {
    try {
      const settings = await getSettings()
      const ics = generateICS({
        id: newAppointment.id,
        date: newAppointment.date,
        time: newAppointment.time,
        customerName: newAppointment.customerName,
        serviceNames: newAppointment.serviceNames,
        location: settings.salonAddress || 'Bien Bonita Nails & Spa',
      })
      await sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: newAppointment.customerEmail,
        subject: `You're booked! ✨ Bien Bonita Appointment Confirmed`,
        html: confirmationEmailHtml({
          customerName: newAppointment.customerName,
          customerEmail: newAppointment.customerEmail,
          date: newAppointment.date,
          time: fmtTime(newAppointment.time),
          serviceNames: newAppointment.serviceNames,
          locationType: 'salon',
          total: newAppointment.total,
          salonAddress: settings.salonAddress,
        }),
        attachments: [{
          filename: 'appointment.ics',
          content: ics,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        }],
      })
      emailed = true
    } catch (err) { console.error('Booking confirmation email failed:', err) }
  }

  return NextResponse.json({ ...newAppointment, emailed }, { status: 201 })
}
