import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, setAppointments } from '@/lib/db'
import { getTransporter, confirmationEmailHtml } from '@/lib/mailer'

function fmtTime(val: string) {
  const [hStr, mStr] = val.split(':')
  const h = parseInt(hStr)
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dh}:${mStr} ${period}`
}

// Public — customers submit booking requests
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, time, customerName, customerEmail, customerPhone, serviceNames, total, notes } = body

  if (!date || !time || !customerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const appointments = await getAppointments()

  // Check if the slot is already taken
  const conflict = appointments.find(a => a.date === date && a.time === time)
  if (conflict) {
    return NextResponse.json({ error: 'That time slot is no longer available.' }, { status: 409 })
  }

  const newAppointment = {
    id: String(Date.now()),
    date,
    time,
    customerName,
    customerEmail,
    customerPhone,
    serviceNames,
    total,
    notes: notes || '',
    locationType: body.locationType || 'salon',
    mobileArea: body.mobileArea || '',
    mobileFee: Number(body.mobileFee) || 0,
    createdAt: new Date().toISOString(),
  }

  appointments.push(newAppointment)
  await setAppointments(appointments)

  // Send confirmation email to customer (best-effort — don't fail the booking if email errors)
  if (customerEmail && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      await getTransporter().sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: `You're booked! ✨ Bien Bonita Appointment Confirmed`,
        html: confirmationEmailHtml({
          customerName,
          date,
          time: fmtTime(time),
          serviceNames: serviceNames ?? '',
          locationType: body.locationType || 'salon',
          mobileArea: body.mobileArea || '',
          total: Number(total) || 0,
        }),
      })
    } catch (err) {
      console.error('Confirmation email failed:', err)
    }
  }

  return NextResponse.json(newAppointment, { status: 201 })
}
