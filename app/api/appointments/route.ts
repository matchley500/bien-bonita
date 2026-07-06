import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, setAppointments, getSettings, getBlocked } from '@/lib/db'
import { getTransporter, bookingRequestEmailHtml, bookingRequestAdminEmailHtml } from '@/lib/mailer'
import { buildAllSlots, isBookableDay, MAX_CLIENTS_PER_DAY } from '@/lib/scheduling'

function fmtTime(val: string) {
  const slots: Record<string, string> = { '09:30': '9:30 AM', '12:00': '12:00 PM', '14:30': '2:30 PM' }
  return slots[val] ?? val
}

function dayOfWeek(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).getDay()
}

// Public — customers submit booking requests
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, time, customerName, customerEmail, customerPhone, serviceNames, total, notes } = body

  if (!date || !time || !customerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate day of week (Tue-Thu only)
  if (!isBookableDay(dayOfWeek(date))) {
    return NextResponse.json({ error: 'Bookings are only available Tuesday through Thursday.' }, { status: 400 })
  }

  // Validate time slot
  if (!buildAllSlots().includes(time)) {
    return NextResponse.json({ error: 'Invalid time slot.' }, { status: 400 })
  }

  // Check if booking is open
  const settings = await getSettings()
  if (!settings.bookingOpen) {
    return NextResponse.json({ error: 'Online booking is currently closed. Please contact us directly.' }, { status: 403 })
  }

  const [appointments, blocked] = await Promise.all([getAppointments(), getBlocked()])

  // Check if day is explicitly blocked
  if (blocked.dates.includes(date) || blocked.weekdays.includes(dayOfWeek(date))) {
    return NextResponse.json({ error: 'This date is not available for booking.' }, { status: 409 })
  }

  // Check if slot is already taken
  const slotTaken = appointments.find(a =>
    a.date === date && a.time === time && a.status !== 'rejected'
  )
  if (slotTaken) {
    return NextResponse.json({ error: 'That time slot is no longer available.' }, { status: 409 })
  }

  // Check max clients per day
  const dayCount = appointments.filter(a =>
    a.date === date && a.status !== 'rejected'
  ).length
  if (dayCount >= MAX_CLIENTS_PER_DAY) {
    return NextResponse.json({ error: 'This day is fully booked. Please choose another day.' }, { status: 409 })
  }

  const newAppointment = {
    id: String(Date.now()),
    date,
    time,
    customerName,
    customerEmail,
    customerPhone,
    serviceNames,
    total: Number(total) || 0,
    notes: notes || '',
    locationType: body.locationType || 'salon',
    mobileArea: body.mobileArea || '',
    mobileFee: Number(body.mobileFee) || 0,
    createdAt: new Date().toISOString(),
    status: 'pending_approval' as const,
  }

  appointments.push(newAppointment)
  await setAppointments(appointments)

  // Notify customer: request received (not yet confirmed)
  if (customerEmail && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await getTransporter().sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: `We received your booking request ✨`,
        html: bookingRequestEmailHtml({
          customerName,
          date,
          time: fmtTime(time),
          serviceNames: serviceNames ?? '',
          locationType: body.locationType || 'salon',
          mobileArea: body.mobileArea || '',
          total: Number(total) || 0,
        }),
      })
    } catch (err) { console.error('Customer request email failed:', err) }
  }

  // Notify admin: new booking needs approval
  const adminEmail = process.env.GMAIL_USER
  if (adminEmail && process.env.GMAIL_APP_PASSWORD) {
    try {
      await getTransporter().sendMail({
        from: `"Bien Bonita Booking" <${adminEmail}>`,
        to: adminEmail,
        subject: `New booking request from ${customerName} — needs approval`,
        html: bookingRequestAdminEmailHtml({
          customerName,
          customerEmail,
          customerPhone,
          date,
          time: fmtTime(time),
          serviceNames: serviceNames ?? '',
          locationType: body.locationType || 'salon',
          mobileArea: body.mobileArea || '',
          mobileFee: Number(body.mobileFee) || 0,
          total: Number(total) || 0,
          notes,
        }),
      })
    } catch (err) { console.error('Admin notification email failed:', err) }
  }

  return NextResponse.json(newAppointment, { status: 201 })
}
