'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  // Only allow same-site relative redirects
  const rawNext = params.get('next') ?? ''
  const nextUrl = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'
  const [tab, setTab] = useState<'login' | 'register'>(params.get('tab') === 'register' ? 'register' : 'login')

  // Messages from the Google OAuth flow
  const oauthError = params.get('error')
  const oauthNotice = params.get('notice')
  const banner =
    oauthNotice === 'requested' ? { tone: 'success' as const, text: 'Account request submitted! You’ll receive a welcome email once it’s approved — then you can sign in with Google.' }
    : oauthNotice === 'pending' ? { tone: 'info' as const, text: 'Your account is still awaiting approval. You’ll receive a welcome email once it’s ready.' }
    : oauthError === 'google' ? { tone: 'error' as const, text: 'Google sign-in didn’t go through. Please try again.' }
    : oauthError === 'google-unavailable' ? { tone: 'error' as const, text: 'Google sign-in isn’t set up yet. Please use your email and password.' }
    : null

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginState, setLoginState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [loginError, setLoginError] = useState('')

  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [regState, setRegState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [regError, setRegError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginState('loading')
    setLoginError('')
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) { setLoginError(data.error ?? 'Login failed.'); setLoginState('error'); return }
      router.push(nextUrl)
    } catch {
      setLoginError('Network error. Please try again.')
      setLoginState('error')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regForm.password !== regForm.confirm) {
      setRegError('Passwords do not match.'); setRegState('error'); return
    }
    if (regForm.password.length < 8) {
      setRegError('Password must be at least 8 characters.'); setRegState('error'); return
    }
    setRegState('loading')
    setRegError('')
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regForm.name, email: regForm.email, phone: regForm.phone, password: regForm.password }),
      })
      const data = await res.json()
      if (!res.ok) { setRegError(data.error ?? 'Registration failed.'); setRegState('error'); return }
      setRegState('success')
    } catch {
      setRegError('Network error. Please try again.')
      setRegState('error')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-script text-teal-500 text-2xl mb-1">welcome back</p>
          <h1 className="font-display text-4xl text-darkbrown">Client Portal</h1>
          <div className="w-10 h-1 bg-mustard-400 mx-auto mt-3 rounded-full" />
          <p className="font-body text-sm text-darkbrown/50 mt-4 tracking-wide">
            View your appointments and request reschedules.
          </p>
        </div>

        {banner && (
          <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-body text-center ${
            banner.tone === 'success' ? 'bg-forest-100 text-forest-700'
            : banner.tone === 'info' ? 'bg-mustard-100 text-mustard-700'
            : 'bg-red-50 text-red-500'
          }`}>
            {banner.text}
          </div>
        )}

        {/* Google sign-in */}
        <a
          href={`/api/auth/google?next=${encodeURIComponent(nextUrl)}`}
          className="flex items-center justify-center gap-3 w-full py-3 mb-4 rounded-2xl border-2 border-sand/50 bg-cream hover:border-terracotta-300 hover:shadow-md transition-all font-body text-sm font-bold text-darkbrown/80"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex-1 h-px bg-sand/40" />
          <span className="font-body text-[10px] uppercase tracking-widest text-darkbrown/30">or</span>
          <span className="flex-1 h-px bg-sand/40" />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-parchment rounded-2xl p-1">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl font-body text-xs uppercase tracking-widest transition-all ${
                tab === t ? 'bg-darkbrown text-cream shadow-sm' : 'text-darkbrown/50 hover:text-darkbrown'
              }`}
            >
              {t === 'login' ? 'Log In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="card space-y-4">
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Email Address</label>
              <input
                type="email" required
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                className="input-field"
                placeholder="your@gmail.com"
              />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Password</label>
              <input
                type="password" required
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            {loginState === 'error' && (
              <p className="text-sm font-body text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{loginError}</p>
            )}
            <button type="submit" disabled={loginState === 'loading'} className="btn-primary w-full disabled:opacity-50">
              {loginState === 'loading' ? 'Logging in…' : 'Log In'}
            </button>
            <p className="text-center font-body text-xs text-darkbrown/40 tracking-wide">
              Don&rsquo;t have an account?{' '}
              <button type="button" onClick={() => setTab('register')} className="text-terracotta-500 hover:underline">
                Create one
              </button>
            </p>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="card space-y-4">
            {regState === 'success' ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 mx-auto bg-forest-100 border-2 border-forest-400 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-script text-teal-500 text-2xl">request sent!</p>
                <p className="font-body text-sm text-darkbrown/60 tracking-wide">
                  Your account request has been submitted for approval. You&rsquo;ll receive a welcome email once it&rsquo;s ready &mdash; then you can log in.
                </p>
                <Link href="/" className="btn-primary inline-block">
                  Back to Home
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Full Name</label>
                  <input
                    type="text" required
                    value={regForm.name}
                    onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Email Address</label>
                  <input
                    type="email" required
                    value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field"
                    placeholder="your@gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Phone Number</label>
                  <input
                    type="tel" required
                    value={regForm.phone}
                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                    className="input-field"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Password</label>
                  <input
                    type="password" required minLength={8}
                    value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    className="input-field"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Confirm Password</label>
                  <input
                    type="password" required
                    value={regForm.confirm}
                    onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                    className="input-field"
                    placeholder="Re-enter password"
                  />
                </div>
                {regState === 'error' && (
                  <p className="text-sm font-body text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{regError}</p>
                )}
                <button type="submit" disabled={regState === 'loading'} className="btn-primary w-full disabled:opacity-50">
                  {regState === 'loading' ? 'Creating account…' : 'Create Account'}
                </button>
                <p className="text-center font-body text-xs text-darkbrown/40 tracking-wide">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} className="text-terracotta-500 hover:underline">
                    Log in
                  </button>
                </p>
              </>
            )}
          </form>
        )}

        <p className="text-center mt-6 font-body text-xs text-darkbrown/30 tracking-wide">
          <Link href="/" className="hover:text-darkbrown/60 transition-colors">← Back to Home</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPageWrapper() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
