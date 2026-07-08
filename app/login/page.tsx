'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginState, setLoginState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [loginError, setLoginError] = useState('')

  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', confirm: '' })
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
      router.push('/dashboard')
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
        body: JSON.stringify({ name: regForm.name, email: regForm.email, password: regForm.password }),
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
