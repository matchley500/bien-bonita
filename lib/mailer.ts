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

// ─── Confirmation email ───────────────────────────────────────────────────────

export function confirmationEmailHtml(opts: {
  customerName: string
  date: string
  time: string
  serviceNames: string
  locationType?: string
  mobileArea?: string
  total?: number
}) {
  return emailShell(`
    <p style="margin:0 0 6px;font-size:22px;color:#C4622D;font-style:italic;">you&rsquo;re booked!</p>
    <h2 style="margin:0 0 24px;font-size:20px;color:#3D2B1F;font-weight:600;">Booking Confirmed</h2>

    <p style="margin:0 0 20px;font-size:15px;color:#5C4A3A;line-height:1.6;">
      Hi ${opts.customerName}! Your appointment has been confirmed. We&rsquo;re so excited to see you &mdash; get ready to feel amazing!
    </p>

    ${appointmentCard(opts)}

    <p style="margin:0 0 8px;font-size:14px;color:#8B7355;line-height:1.6;">
      Need to reschedule or have questions? Reply to this email or reach us at
      <a href="mailto:bienbonitanailandspa@gmail.com" style="color:#C4622D;text-decoration:none;">bienbonitanailandspa@gmail.com</a>.
    </p>
    <p style="margin:0;font-size:14px;color:#8B7355;line-height:1.6;">
      We appreciate you choosing Bien Bonita. See you soon!
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
