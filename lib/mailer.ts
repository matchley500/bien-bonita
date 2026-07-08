import nodemailer from 'nodemailer'

// Created lazily so env vars are read at request time, not build time
export function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// Rough plain-text rendering of our email HTML for the multipart alternative.
// HTML-only email scores higher with spam filters.
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|div|h[1-6]|li|tr|td)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/^ +| +$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function sendMail(opts: {
  from: string
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: string; contentType: string }[]
}) {
  return getTransporter().sendMail({ ...opts, text: htmlToText(opts.html) })
}

// ─── ICS calendar attachment ──────────────────────────────────────────────────

export function generateICS(opts: {
  id: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM (Arizona local, UTC-7)
  customerName: string
  serviceNames?: string
  durationMinutes?: number
}): string {
  const [y, mo, d] = opts.date.split('-').map(Number)
  const [h, m] = opts.time.split(':').map(Number)
  const duration = opts.durationMinutes ?? 120

  // Arizona is UTC-7 (no DST) — add 7 hours for UTC
  const startUtc = new Date(Date.UTC(y, mo - 1, d, h + 7, m, 0))
  const endUtc = new Date(startUtc.getTime() + duration * 60_000)

  const fmt = (dt: Date) =>
    dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const desc = opts.serviceNames
    ? opts.serviceNames.replace(/,/g, '\\,')
    : 'Nail appointment'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bien Bonita Nails & Spa//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${opts.id}@bienbonitanailspa.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(startUtc)}`,
    `DTEND:${fmt(endUtc)}`,
    'SUMMARY:Bien Bonita Nails & Spa Appointment',
    `DESCRIPTION:${desc}`,
    'LOCATION:Bien Bonita Nails & Spa',
    `ORGANIZER;CN=Bien Bonita Nails & Spa:mailto:${process.env.GMAIL_USER ?? 'bienbonitanailandspa@gmail.com'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFDF8;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

        <!-- Header -->
        <tr>
          <td style="background:#3D2B1F;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#C4622D;letter-spacing:0.15em;text-transform:uppercase;font-family:sans-serif;">Bien Bonita</p>
            <h1 style="margin:4px 0 0;font-size:28px;color:#F5F0E8;font-weight:400;letter-spacing:0.02em;">Nails &amp; Spa</h1>
            <div style="width:40px;height:2px;background:#C4622D;margin:12px auto 0;border-radius:2px;"></div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F5F0E8;padding:20px 40px;text-align:center;border-top:1px solid #E8DFD0;">
            <p style="margin:0;font-size:11px;color:#B0A090;font-family:sans-serif;letter-spacing:0.08em;text-transform:uppercase;">
              Bien Bonita Nails &amp; Spa · Southwest, USA
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Shared appointment card ──────────────────────────────────────────────────

function appointmentCard({
  date, time, serviceNames, locationType, mobileArea, total,
}: {
  date: string
  time: string
  serviceNames: string
  locationType?: string
  mobileArea?: string
  total?: number
}) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const locationLine = locationType === 'mobile' && mobileArea
    ? `<p style="margin:0 0 4px;font-size:14px;color:#8B7355;">🚗 Mobile service · ${mobileArea}</p>`
    : `<p style="margin:0 0 4px;font-size:14px;color:#8B7355;">🏠 In salon</p>`
  const totalLine = total != null && total > 0
    ? `<p style="margin:8px 0 0;font-size:15px;color:#3D2B1F;font-weight:600;border-top:1px solid #E8DFD0;padding-top:8px;">Est. Total &nbsp;<span style="color:#C4622D;">$${total}</span></p>`
    : ''

  return `<div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Your Appointment</p>
    <p style="margin:0 0 8px;font-size:18px;color:#3D2B1F;font-weight:600;">${formattedDate}</p>
    <p style="margin:0 0 4px;font-size:15px;color:#C4622D;font-weight:600;">⏰ ${time}</p>
    ${serviceNames ? `<p style="margin:0 0 4px;font-size:14px;color:#5C7A6E;">✨ ${serviceNames}</p>` : ''}
    ${locationLine}
    ${totalLine}
  </div>`
}

// ─── Booking request received (to customer — pending approval) ────────────────

export function bookingRequestEmailHtml(opts: {
  customerName: string
  date: string
  time: string
  serviceNames: string
  locationType?: string
  mobileArea?: string
  total?: number
}) {
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">request received!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">We Got Your Booking</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.customerName}! We&rsquo;ve received your appointment request and will confirm it shortly. We&rsquo;ll send you another email once it&rsquo;s approved.
    </p>

    ${appointmentCard(opts)}

    <p style="margin:0 0 16px;font-size:14px;color:#8B7355;line-height:1.6;">
      Questions? Reach us at
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>.
    </p>
    <p style="margin:0;font-size:13px;color:#B0A090;line-height:1.5;">
      Your appointment slot is held pending approval. You&rsquo;ll hear from us soon!
    </p>
  `)
}

// ─── New booking notification (to admin) ─────────────────────────────────────

export function bookingRequestAdminEmailHtml(opts: {
  customerName: string
  customerEmail: string
  customerPhone?: string
  date: string
  time: string
  serviceNames: string
  locationType?: string
  mobileArea?: string
  mobileFee?: number
  total?: number
  notes?: string
}) {
  const formattedDate = new Date(opts.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bien-bonita.vercel.app'
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">new booking!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Approval Needed</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      <strong>${opts.customerName}</strong> has submitted a booking request. Log in to approve or reject it.
    </p>

    <div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Appointment Details</p>
      <p style="margin:0 0 4px;font-size:18px;color:#3D2B1F;font-weight:600;">${formattedDate}</p>
      <p style="margin:0 0 4px;font-size:15px;color:#C4622D;font-weight:600;">⏰ ${opts.time}</p>
      ${opts.serviceNames ? `<p style="margin:0 0 4px;font-size:14px;color:#5C7A6E;">✨ ${opts.serviceNames}</p>` : ''}
      ${opts.locationType === 'mobile' && opts.mobileArea ? `<p style="margin:0 0 4px;font-size:14px;color:#8B7355;">🚗 Mobile · ${opts.mobileArea}${opts.mobileFee ? ` (+$${opts.mobileFee})` : ''}</p>` : '<p style="margin:0 0 4px;font-size:14px;color:#8B7355;">🏠 In salon</p>'}
      ${opts.total ? `<p style="margin:8px 0 0;font-size:15px;color:#3D2B1F;font-weight:600;border-top:1px solid #E8DFD0;padding-top:8px;">Est. $${opts.total}</p>` : ''}
      ${opts.notes ? `<p style="margin:8px 0 0;font-size:13px;color:#8B7355;font-style:italic;">"${opts.notes}"</p>` : ''}
    </div>

    <div style="background:#F5F0E8;border-radius:16px;padding:16px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Client</p>
      <p style="margin:0 0 2px;font-size:14px;color:#3D2B1F;">${opts.customerEmail}</p>
      ${opts.customerPhone ? `<p style="margin:0;font-size:14px;color:#3D2B1F;">${opts.customerPhone}</p>` : ''}
    </div>

    <div style="text-align:center;margin-bottom:8px;">
      <a href="${adminUrl}/admin"
         style="display:inline-block;padding:12px 32px;background:#C4622D;border-radius:50px;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#FFFDF8;text-decoration:none;">
        Review in Dashboard
      </a>
    </div>
  `)
}

// ─── Account creation request (to admin — needs approval) ────────────────────

export function accountRequestAdminEmailHtml(opts: {
  name: string
  email: string
  createdAt: string
}) {
  const formatted = new Date(opts.createdAt).toLocaleString('en-US', {
    timeZone: 'America/Phoenix',
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bien-bonita.vercel.app'
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">account request</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Approval Needed</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      <strong>${opts.name}</strong> has requested a client portal account. Log in to the dashboard to approve or deny it. They can&rsquo;t sign in until you approve.
    </p>

    <div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Requested Account</p>
      <p style="margin:0 0 2px;font-size:16px;color:#3D2B1F;font-weight:600;">${opts.name}</p>
      <p style="margin:0 0 2px;font-size:14px;color:#3D2B1F;">${opts.email}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#8B7355;">Requested ${formatted} (Arizona time)</p>
    </div>

    <div style="text-align:center;margin-bottom:8px;">
      <a href="${adminUrl}/admin"
         style="display:inline-block;padding:12px 32px;background:#C4622D;border-radius:50px;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#FFFDF8;text-decoration:none;">
        Review in Dashboard
      </a>
    </div>
  `)
}

// ─── Welcome email (to customer — sent after admin approves account) ──────────

export function welcomeEmailHtml(opts: {
  name: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bien-bonita.vercel.app'
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">bienvenida!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Welcome to Bien Bonita</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.name}! Your account has been approved &mdash; welcome to our exclusive salon family. We&rsquo;re so happy to have you.
    </p>

    <div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Your Client Portal</p>
      <p style="margin:0 0 4px;font-size:14px;color:#5C4A3A;line-height:1.6;">✨ View your upcoming &amp; past appointments</p>
      <p style="margin:0 0 4px;font-size:14px;color:#5C4A3A;line-height:1.6;">🔄 Request reschedules in a couple of taps</p>
      <p style="margin:0;font-size:14px;color:#5C4A3A;line-height:1.6;">💅 Stay connected with your salon</p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${siteUrl}/login"
         style="display:inline-block;padding:12px 32px;background:#C4622D;border-radius:50px;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#FFFDF8;text-decoration:none;">
        Log In to Your Portal
      </a>
    </div>

    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      Questions? Reply to this email or reach us at
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>. See you soon!
    </p>
  `)
}

// ─── Password reset (to customer — admin triggered) ──────────────────────────

export function passwordResetEmailHtml(opts: {
  name: string
  tempPassword: string
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bien-bonita.vercel.app'
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">password reset</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Your New Password</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.name}! Your client portal password has been reset. Use this temporary password to log in:
    </p>

    <div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Temporary Password</p>
      <p style="margin:0;font-size:22px;color:#3D2B1F;font-weight:700;font-family:monospace;letter-spacing:0.08em;">${opts.tempPassword}</p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${siteUrl}/login"
         style="display:inline-block;padding:12px 32px;background:#C4622D;border-radius:50px;font-family:sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#FFFDF8;text-decoration:none;">
        Log In Now
      </a>
    </div>

    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      If you didn&rsquo;t request this, reply to this email or reach us at
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>.
    </p>
  `)
}

// ─── Confirmation email (sent after admin approves) ───────────────────────────

export function confirmationEmailHtml(opts: {
  customerName: string
  customerEmail?: string
  date: string
  time: string
  serviceNames: string
  locationType?: string
  mobileArea?: string
  total?: number
}) {
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">you&rsquo;re booked!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Appointment Confirmed</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.customerName}! Your appointment has been confirmed. We&rsquo;re so excited to see you &mdash; get ready to feel amazing! A calendar invite is attached to this email.
    </p>

    ${appointmentCard(opts)}

    <p style="margin:0 0 16px;font-size:14px;color:#8B7355;line-height:1.6;">
      Have questions? Reply to this email or reach us at
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bien-bonita.vercel.app'}/reschedule?email=${encodeURIComponent(opts.customerEmail ?? '')}&date=${opts.date}"
         style="display:inline-block;padding:10px 24px;background:#F5F0E8;border-radius:50px;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8B7355;text-decoration:none;">
        Request Reschedule
      </a>
    </div>
    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      We appreciate you choosing Bien Bonita. See you soon!
    </p>
  `)
}

// ─── Rejection email (sent after admin rejects) ───────────────────────────────

export function rejectionEmailHtml(opts: {
  customerName: string
  date: string
  time: string
}) {
  const formattedDate = new Date(opts.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">we&rsquo;re sorry!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Booking Unavailable</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.customerName}, unfortunately we&rsquo;re unable to confirm your appointment request for <strong>${formattedDate} at ${opts.time}</strong>.
    </p>

    <p style="margin:0 0 20px;font-size:14px;color:#8B7355;line-height:1.6;">
      This may be due to a scheduling conflict. Please reach out to us directly to find a time that works:
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>
    </p>

    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      We appreciate your patience and hope to see you soon!
    </p>
  `)
}

// ─── Reminder email ───────────────────────────────────────────────────────────

export function reminderEmailHtml(opts: {
  customerName: string
  date: string
  time: string
  serviceNames: string
  locationType?: string
  mobileArea?: string
}) {
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">see you tomorrow!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Appointment Reminder</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.customerName}, just a friendly reminder that your appointment is <strong>tomorrow</strong>. We can&rsquo;t wait to see you!
    </p>

    ${appointmentCard(opts)}

    <p style="margin:0 0 8px;font-size:14px;color:#8B7355;line-height:1.6;">
      If you need to reschedule or have any questions, reply to this email or reach us at
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>.
    </p>
    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      We appreciate your business and look forward to seeing you!
    </p>
  `)
}

// ─── Reschedule request received (to customer) ────────────────────────────────

export function rescheduleReceivedEmailHtml(opts: {
  customerName: string
  currentDate: string
  currentTime: string
  requestedDate: string
  requestedTime: string
  note?: string
}) {
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">request received!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Reschedule Request</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.customerName}! We&rsquo;ve received your reschedule request and will be in touch shortly to confirm your new time.
    </p>

    <div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Current Appointment</p>
      <p style="margin:0;font-size:15px;color:#3D2B1F;">${fmt(opts.currentDate)} at ${opts.currentTime}</p>
    </div>

    <div style="background:#FFF8F0;border:1px solid #E8C4A0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#C4622D;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Requested New Time</p>
      <p style="margin:0 0 4px;font-size:15px;color:#3D2B1F;font-weight:600;">${fmt(opts.requestedDate)} at ${opts.requestedTime}</p>
      ${opts.note ? `<p style="margin:8px 0 0;font-size:13px;color:#8B7355;font-style:italic;">&ldquo;${opts.note}&rdquo;</p>` : ''}
    </div>

    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      Questions? Reach us at <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>.
    </p>
  `)
}

// ─── Reschedule request notification (to admin) ───────────────────────────────

export function rescheduleAdminEmailHtml(opts: {
  customerName: string
  customerEmail: string
  customerPhone?: string
  currentDate: string
  currentTime: string
  requestedDate: string
  requestedTime: string
  note?: string
}) {
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">reschedule request</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Action Needed</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      <strong>${opts.customerName}</strong> has requested to reschedule their appointment.
    </p>

    <div style="background:#F5F0E8;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Current Appointment</p>
      <p style="margin:0;font-size:15px;color:#3D2B1F;">${fmt(opts.currentDate)} at ${opts.currentTime}</p>
    </div>

    <div style="background:#FFF8F0;border:1px solid #E8C4A0;border-radius:16px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#C4622D;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Requested New Time</p>
      <p style="margin:0 0 4px;font-size:15px;color:#3D2B1F;font-weight:600;">${fmt(opts.requestedDate)} at ${opts.requestedTime}</p>
      ${opts.note ? `<p style="margin:8px 0 0;font-size:13px;color:#8B7355;font-style:italic;">&ldquo;${opts.note}&rdquo;</p>` : ''}
    </div>

    <div style="background:#F5F0E8;border-radius:16px;padding:16px 24px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:11px;color:#8B7355;text-transform:uppercase;letter-spacing:0.12em;font-family:sans-serif;font-weight:700;">Customer</p>
      <p style="margin:0 0 2px;font-size:14px;color:#3D2B1F;">${opts.customerEmail}</p>
      ${opts.customerPhone ? `<p style="margin:0;font-size:14px;color:#3D2B1F;">${opts.customerPhone}</p>` : ''}
    </div>

    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      Log in to the admin dashboard to apply the reschedule.
    </p>
  `)
}
