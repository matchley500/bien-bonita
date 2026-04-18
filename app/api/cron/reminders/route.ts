import { NextRequest, NextResponse } from 'next/server'
import { getAppointments } from '@/lib/db'
import { getTransporter, reminderEmailHtml } from '@/lib/mailer'

// Formats "08:30" → "8:30 AM"
function fmtTime(val: string) {
  const [hStr, mStr] = val.split(':')
  const h = parseInt(hStr)
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dh}:${mStr} ${period}`
}

// Returns "YYYY-MM-DD" for tomorrow in Arizona (MST = UTC-7, no DST)
function tomorrowAZ(): string {
  const now = new Date()
  const azOffset = -7 * 60
  const localOffset = now.getTimezoneOffset()
  const azNow = new Date(now.getTime() + (localOffset - Math.abs(azOffset)) * 60 * 1000)
  const tomorrow = new Date(azNow)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = tomorrowAZ()
  const appointments = await getAppointments()
  const toRemind = appointments.filter(
    a => a.date === tomorrow && a.customerEmail && a.status !== 'done'
  )

  if (toRemind.length === 0) {
    return NextResponse.json({ sent: 0, date: tomorrow, message: 'No appointments to remind.' })
  }

  const transporter = getTransporter()
  const results: { name: string; email: string; ok: boolean; error?: string }[] = []

  for (const appt of toRemind) {
    try {
      await transporter.sendMail({
        from: `"Bien Bonita Nails & Spa" <${process.env.GMAIL_USER}>`,
        to: appt.customerEmail,
        subject: `Reminder: Your appointment is tomorrow ✨`,
        html: reminderEmailHtml({
          customerName: appt.customerName,
          date: appt.date,
          time: fmtTime(appt.time),
          serviceNames: appt.serviceNames,
          locationType: appt.locationType,
          mobileArea: appt.mobileArea,
        }),
      })
      results.push({ name: appt.customerName, email: appt.customerEmail, ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ name: appt.customerName, email: appt.customerEmail, ok: false, error: msg })
    }
  }

  const sent = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  return NextResponse.json({ sent, failed, date: tomorrow, results })
}
