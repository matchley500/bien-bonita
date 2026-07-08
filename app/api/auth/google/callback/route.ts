import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, setCustomers } from '@/lib/db'
import { createCustomerSession, CUSTOMER_SESSION_MAX_AGE } from '@/lib/customers'
import { sendMail, accountRequestAdminEmailHtml } from '@/lib/mailer'

export async function GET(request: NextRequest) {
  const url = request.nextUrl

  const redirect = (path: string) => {
    const res = NextResponse.redirect(new URL(path, url))
    res.cookies.delete('google_oauth')
    return res
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const stored = request.cookies.get('google_oauth')?.value
  if (!code || !state || !stored) return redirect('/login?error=google')

  let parsed: { state: string; next: string }
  try { parsed = JSON.parse(stored) } catch { return redirect('/login?error=google') }
  if (parsed.state !== state) return redirect('/login?error=google')
  const next = parsed.next?.startsWith('/') && !parsed.next.startsWith('//') ? parsed.next : '/dashboard'

  // Exchange the code for tokens
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.ok) return redirect('/login?error=google')
  const tokens = await tokenRes.json()

  // The id_token came straight from Google over TLS — decode without re-verifying
  const payloadB64 = String(tokens.id_token ?? '').split('.')[1]
  if (!payloadB64) return redirect('/login?error=google')
  let claims: { email?: string; name?: string; email_verified?: boolean }
  try { claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) } catch { return redirect('/login?error=google') }

  const email = (claims.email ?? '').toLowerCase().trim()
  if (!email || claims.email_verified === false) return redirect('/login?error=google')

  const customers = await getCustomers()
  const customer = customers.find(c => c.email.toLowerCase() === email)

  // First time seeing this Google account → create a pending account request
  if (!customer) {
    const newCustomer = {
      id: String(Date.now()),
      email,
      passwordHash: '', // Google-only account; admin can issue a password via Reset
      name: (claims.name ?? '').trim() || email.split('@')[0],
      phone: '',
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    }
    customers.push(newCustomer)
    await setCustomers(customers)

    const adminEmail = process.env.GMAIL_USER
    if (adminEmail && process.env.GMAIL_APP_PASSWORD) {
      try {
        await sendMail({
          from: `"Bien Bonita Website" <${adminEmail}>`,
          to: adminEmail,
          subject: `Account request from ${newCustomer.name} — needs approval`,
          html: accountRequestAdminEmailHtml({
            name: newCustomer.name,
            email: newCustomer.email,
            createdAt: newCustomer.createdAt,
          }),
        })
      } catch (err) { console.error('Account request admin email failed:', err) }
    }
    return redirect('/login?notice=requested')
  }

  if (customer.status === 'pending') return redirect('/login?notice=pending')

  const token = await createCustomerSession(customer.email)
  const res = redirect(next)
  res.cookies.set('customer_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CUSTOMER_SESSION_MAX_AGE,
    path: '/',
  })
  return res
}
