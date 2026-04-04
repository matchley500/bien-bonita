'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) { setError('Invalid email or password'); setLoading(false); return }
      router.push('/admin')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <p className="font-script text-teal-500 text-xl mb-1">admin</p>
          <h1 className="font-display text-3xl text-darkbrown">Sign In</h1>
          <div className="w-10 h-0.5 bg-mustard-400 mx-auto mt-3 rounded-full" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="border-2 border-terracotta-300 bg-terracotta-50 text-terracotta-700 text-sm font-body px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="admin@bienbonita.com" />
          </div>
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
