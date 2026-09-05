import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, setAppointments, getBlocked, getCustomers, setCustomers, getSettings } from '@/lib/db'
import { verifyCustomerSession } from '@/lib/customers'
import { sendMail, bookingRequestEmailHtml, bookingRequestAdminEmailHtml } from '@/lib/mailer'
import { formatSlotLabel as fmtTime } from '@/lib/scheduling'

function dayOfWeek(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).getDay()
}

// Customers submit booking requests — requires a logged-in, approved account
export async function POST(request: NextRequest) {
  const sessionEmail = await verifyCustomerSession()
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Please log in to book an appointment.' }, { status: 401 })
  }

  const customers = await getCustomers()
  const customer = customers.find(c => c.email.toLowerCase() === sessionEmail.toLowerCase())
  if (!customer || customer.status === 'pending') {
    return NextResponse.json({ error: 'Your account is not active yet.' }, { status: 403 })
  }

  const body = await request.json()
  const { date, time, serviceNames, total, notes } = body

  // Identity comes from the account, not the request
  const customerName = customer.name
  const customerEmail = customer.email
  const customerPhone = customer.phone || (body.customerPhone ?? '').trim()

  // Older accounts have no phone on file — save it the first time they book
  if (!customer.phone && customerPhone) {
    const idx = customers.findIndex(c => c.id === customer.id)
    customers[idx] = { ...customer, phone: customerPhone }
    await setCustomers(customers)
  }

  if (!date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const address = (body.address ?? '').trim()
  if (body.locationType === 'mobile' && !address) {
    return NextResponse.json({ error: 'Please provide your address for mobile service.' }, { status: 400 })
  }

  // Approved accounts may always book — the "booking closed" setting only
  // gates new clients, and account approval is that gate now.
  const [appointments, blocked, settings] = await Promise.all([
    getAppointments(), getBlocked(), getSettings(),
  ])

  // Validate time slot against the admin's current schedule
  if (!settings.slots.includes(time)) {
    return NextResponse.json({ error: 'Invalid time slot.' }, { status: 400 })
  }

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
  if (dayCount >= settings.maxClientsPerDay) {
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
    address: body.locationType === 'mobile' ? address : '',
    createdAt: new Date().toISOString(),
    status: 'pending_approval' as const,
  }

  appointments.push(newAppointment)
  await setAppointments(appointments)

  // Notify customer: request received (not yet confirmed)
  if (customerEmail && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await sendMail({
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
      await sendMail({
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
          address: newAppointment.address,
          total: Number(total) || 0,
          notes,
        }),
      })
    } catch (err) { console.error('Admin notification email failed:', err) }
  }

  return NextResponse.json(newAppointment, { status: 201 })
}
