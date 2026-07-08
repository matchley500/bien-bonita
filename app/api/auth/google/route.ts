import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// Kicks off Google OAuth — redirects the browser to Google's consent screen
export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=google-unavailable', request.url))
  }

  const rawNext = request.nextUrl.searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
  const state = randomBytes(16).toString('hex')
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  response.cookies.set('google_oauth', JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes to complete the flow
    path: '/',
  })
  return response
}
