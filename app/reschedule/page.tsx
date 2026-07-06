'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BookingCalendar from '@/components/BookingCalendar'

const ALL_TIME_SLOTS = [
  { value: '09:30', label: '9:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:30', label: '2:30 PM' },
]

function ReschedulePage() {
  const params = useSearchParams()
  const [form, setForm] = useState({
    email: params.get('email') ?? '',
    currentDate: params.get('date') ?? '',
    requestedDate: '',
    requestedTime: '',
    note: '',
  })
  const [viewing, setViewing] = useState(() => new Date())
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set())
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<'form' | 'success' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch unavailable dates for current month
  useEffect(() => {
    const month = `${viewing.getFullYear()}-${String(viewing.getMonth() + 1).padStart(2, '0')}`
    fetch(`/api/appointments/available-dates?month=${month}`)
      .then(r => r.json())
      .then(d => setUnavailableDates(new Set(d.unavailable ?? [])))
  }, [viewing])

  // Fetch available times when date selected
  useEffect(() => {
    if (!form.requestedDate) { setAvailableTimes([]); return }
    setLoadingTimes(true)
    fetch(`/api/appointments/availability?date=${form.requestedDate}`)
      .then(r => r.json())
      .then(d => { setAvailableTimes(d.available ?? []); setLoadingTimes(false) })
  }, [form.requestedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/appointments/reschedule-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Something went wrong.'); setState('error') }
      else setState('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setState('error')
    }
    setSubmitting(false)
  }

  if (state === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-forest-100 border-2 border-forest-400 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-script text-teal-500 text-3xl mb-2">request sent!</p>
        <h1 className="font-display text-3xl text-darkbrown mb-4">We&rsquo;ll Be In Touch</h1>
        <p className="font-body text-darkbrown/60 text-sm leading-relaxed mb-8">
          Your reschedule request has been received. We&rsquo;ll confirm your new appointment time by email shortly.
        </p>
        <Link href="/" className="btn-secondary">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <p className="font-script text-teal-500 text-2xl mb-1">no worries!</p>
        <h1 className="font-display text-4xl text-darkbrown">Request a Reschedule</h1>
        <div className="w-12 h-1 bg-mustard-400 mx-auto mt-4 rounded-full" />
        <p className="font-body text-sm text-darkbrown/50 mt-4 tracking-wide">
          Fill out the form below and we&rsquo;ll get back to you to confirm your new time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Current appointment info */}
        <div className="card space-y-4">
          <p className="font-script text-teal-500 text-xl">your current booking</p>
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Email Address *</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="The email you booked with"
            />
          </div>
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Current Appointment Date *</label>
            <input
              type="date" required
              value={form.currentDate}
              onChange={e => setForm(f => ({ ...f, currentDate: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        {/* New date */}
        <div className="card">
          <p className="font-script text-teal-500 text-xl mb-1">pick a new date</p>
          <p className="font-body text-xs text-darkbrown/40 tracking-widest uppercase mb-4">Crossed-out dates are unavailable</p>
          <BookingCalendar
            unavailableDates={unavailableDates}
            selectedDate={form.requestedDate}
            onSelectDate={d => setForm(f => ({ ...f, requestedDate: d, requestedTime: '' }))}
            viewing={viewing}
            onPrev={() => setViewing(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
            onNext={() => setViewing(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          />
        </div>

        {/* New time */}
        {form.requestedDate && (
          <div className="card">
            <p className="font-script text-teal-500 text-xl mb-1">choose a new time</p>
            {loadingTimes ? (
              <p className="font-body text-sm text-darkbrown/40 tracking-wide py-4 text-center">Loading…</p>
            ) : availableTimes.length === 0 ? (
              <p className="font-body text-sm text-darkbrown/40 tracking-wide py-4 text-center">No available slots on this day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimes.map(slot => {
                  const label = ALL_TIME_SLOTS.find(s => s.value === slot)?.label ?? slot
                  return (
                    <button
                      key={slot} type="button"
                      onClick={() => setForm(f => ({ ...f, requestedTime: slot }))}
                      className={`py-2.5 rounded-2xl border-2 text-xs font-body font-bold tracking-wide transition-all ${
                        form.requestedTime === slot
                          ? 'border-terracotta-500 bg-terracotta-500 text-cream shadow'
                          : 'border-sand/40 text-darkbrown/70 hover:border-terracotta-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        <div className="card space-y-3">
          <p className="font-script text-teal-500 text-xl">anything else?</p>
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Note (optional)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="input-field h-24 resize-none"
              placeholder="Any preferences or context for the reschedule…"
            />
          </div>
        </div>

        {state === 'error' && (
          <p className="text-sm font-body text-red-500 bg-red-50 rounded-2xl px-4 py-3 text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !form.email || !form.currentDate || !form.requestedDate || !form.requestedTime}
          className="btn-primary w-full disabled:opacity-40"
        >
          {submitting ? 'Sending…' : 'Submit Reschedule Request'}
        </button>

        <p className="text-center font-body text-xs text-darkbrown/40 tracking-wide">
          Your original appointment is held until we confirm the change.
        </p>
      </form>
    </div>
  )
}

export default function ReschedulePageWrapper() {
  return (
    <Suspense>
      <ReschedulePage />
    </Suspense>
  )
}
