import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getAppointments } from '@/lib/db'
import { transporter, reminderEmailHtml } from '@/lib/mailer'

function fmtTime(val: string) {
  const [hStr, mStr] = val.split(':')
  const h = parseInt(hStr)
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dh}:${mStr} ${period}`
}

export async function POST() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.GMAIL_USER
  if (!adminEmail) {
    return NextResponse.json({ error: 'GMAIL_USER env var not set' }, { status: 500 })
  }

  // Find the next upcoming appointment that isn't done
  const today = new Date().toISOString().split('T')[0]
  const appointments = await getAppointments()
  const upcoming = appointments
    .filter(a => a.date >= today && a.status !== 'done')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  // Use the next real appointment, or fall back to a realistic dummy
  const source = upcoming[0] ?? {
    customerName: 'Sample Customer',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    time: '10:30',
    serviceNames: 'Spa Manicure, Gel Polish',
    locationType: 'salon',
    mobileArea: '',
  }

  await transporter.sendMail({
    from: `"Bien Bonita Nails & Spa" <${adminEmail}>`,
    to: adminEmail,
    subject: `[TEST] Reminder: Your appointment is tomorrow ✨`,
    html: reminderEmailHtml({
      customerName: source.customerName,
      date: source.date,
      time: fmtTime(source.time),
      serviceNames: source.serviceNames ?? '',
      locationType: source.locationType,
      mobileArea: source.mobileArea,
    }),
  })

  return NextResponse.json({
    ok: true,
    sentTo: adminEmail,
    usedAppointment: upcoming[0] ? 'real' : 'dummy',
    customerName: source.customerName,
    date: source.date,
  })
}
