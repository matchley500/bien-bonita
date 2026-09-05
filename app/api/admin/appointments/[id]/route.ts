import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAppointments, setAppointments, getSettings } from '@/lib/db'
import { sendMail, confirmationEmailHtml, rejectionEmailHtml, appointmentUpdatedEmailHtml, generateICS } from '@/lib/mailer'
import { formatSlotLabel as fmtTime } from '@/lib/scheduling'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  // notifyCustomer is a directive, not appointment data — don't store it
  const { notifyCustomer, ...updates } = body
  const appointments = await getAppointments()
  const index = appointments.findIndex(a => a.id === id)

  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const previous = appointments[index]
  const merged = { ...previous, ...updates }
  if (updates.rescheduleRequest === null) delete merged.rescheduleRequest
  appointments[index] = merged
  await setAppointments(appointments)

  const adminEmail = process.env.GMAIL_USER
  const canEmail = !!(adminEmail && process.env.GMAIL_APP_PASSWORD)

  // Appointment approved → send confirmation + ICS to customer
  if (
    canEmail &&
    body.status === 'confirmed' &&
    previous.status === 'pending_approval' &&
    merged.customerEmail
  ) {
    try {
      const settings = await getSettings()
      const location = merged.locationType === 'mobile' && merged.address
        ? merged.address
        : settings.salonAddress || 'Bien Bonita Nails & Spa'
      const ics = generateICS({
        id: merged.id,
        date: merged.date,
        time: merged.time,
        customerName: merged.customerName,
        serviceNames: merged.serviceNames,
        location,
      })
      await sendMail({
        from: `"Bien Bonita Nails & Spa" <${adminEmail}>`,
        to: merged.customerEmail,
        subject: `You're booked! ✨ Bien Bonita Appointment Confirmed`,
        html: confirmationEmailHtml({
          customerName: merged.customerName,
          customerEmail: merged.customerEmail,
          date: merged.date,
          time: fmtTime(merged.time),
          serviceNames: merged.serviceNames ?? '',
          locationType: merged.locationType,
          mobileArea: merged.mobileArea,
          total: merged.total,
          salonAddress: settings.salonAddress,
          address: merged.address,
        }),
        attachments: [{
          filename: 'appointment.ics',
          content: ics,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        }],
      })
    } catch (err) { console.error('Confirmation email failed:', err) }
  }

  // Appointment rejected → send rejection email to customer
  if (
    canEmail &&
    body.status === 'rejected' &&
    previous.status !== 'rejected' &&
    merged.customerEmail
  ) {
    try {
      await sendMail({
        from: `"Bien Bonita Nails & Spa" <${adminEmail}>`,
        to: merged.customerEmail,
        subject: `Regarding your Bien Bonita booking request`,
        html: rejectionEmailHtml({
          customerName: merged.customerName,
          date: merged.date,
          time: fmtTime(merged.time),
        }),
      })
    } catch (err) { console.error('Rejection email failed:', err) }
  }

  // Admin edited the appointment and asked to notify the customer
  if (canEmail && notifyCustomer === true && merged.customerEmail) {
    try {
      const settings = await getSettings()
      const location = merged.locationType === 'mobile' && merged.address
        ? merged.address
        : settings.salonAddress || 'Bien Bonita Nails & Spa'
      const ics = generateICS({
        id: merged.id,
        date: merged.date,
        time: merged.time,
        customerName: merged.customerName,
        serviceNames: merged.serviceNames,
        location,
      })
      await sendMail({
        from: `"Bien Bonita Nails & Spa" <${adminEmail}>`,
        to: merged.customerEmail,
        subject: `Your Bien Bonita appointment was updated`,
        html: appointmentUpdatedEmailHtml({
          customerName: merged.customerName,
          customerEmail: merged.customerEmail,
          date: merged.date,
          time: fmtTime(merged.time),
          serviceNames: merged.serviceNames ?? '',
          locationType: merged.locationType,
          mobileArea: merged.mobileArea,
          total: merged.total,
          salonAddress: settings.salonAddress,
          address: merged.address,
        }),
        attachments: [{
          filename: 'appointment.ics',
          content: ics,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        }],
      })
    } catch (err) { console.error('Update notification email failed:', err) }
  }

  return NextResponse.json(appointments[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const appointments = await getAppointments()
  const filtered = appointments.filter(a => a.id !== id)
  await setAppointments(filtered)

  return NextResponse.json({ success: true })
}
