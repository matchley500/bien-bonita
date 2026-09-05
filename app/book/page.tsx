'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BookingCalendar, { toDateKey } from '@/components/BookingCalendar'
import { formatSlotLabel, DEFAULT_GEL_UPGRADE_PRICE } from '@/lib/scheduling'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  category: string
  hasGelUpgrade?: boolean
}

interface MobileArea {
  id: string
  label: string
  fee: number
}

const categoryLabels: Record<string, string> = {
  manicure: 'Manicures', pedicure: 'Pedicures', gel: 'Gel Polish',
  extensions: 'Extensions', removals: 'Removals', designs: 'Designs', addons: 'Add-Ons',
}
const categoryColors: Record<string, string> = {
  manicure: 'bg-terracotta-500 text-cream', pedicure: 'bg-teal-500 text-cream',
  gel: 'bg-forest-500 text-cream', extensions: 'bg-mustard-500 text-darkbrown',
  removals: 'bg-terracotta-700 text-cream', designs: 'bg-teal-600 text-cream',
  addons: 'bg-forest-600 text-cream',
}
const categoryOrder = ['manicure', 'pedicure', 'gel', 'extensions', 'removals', 'designs', 'addons']

// Bookable times come from the availability API, which reflects the admin's
// configured schedule — this just renders whatever comes back.
const formatTime = formatSlotLabel

// ── Time Slot Picker ──────────────────────────────────────────────────────────
function TimeSlotPicker({
  availableSlots,
  selectedTime,
  onSelect,
  loading,
}: {
  availableSlots: string[]
  selectedTime: string
  onSelect: (time: string) => void
  loading: boolean
}) {
  if (loading) {
    return <p className="text-sm font-body text-darkbrown/40 tracking-wide text-center py-4">Checking availability…</p>
  }
  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-4 rounded-2xl bg-parchment/50">
        <p className="text-sm font-body text-darkbrown/50 tracking-wide">No available times on this day.</p>
        <p className="text-xs font-body text-darkbrown/30 mt-1">Please choose a different date.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {availableSlots.map(slot => {
        const label = formatSlotLabel(slot)
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`py-2 px-1 rounded-xl border-2 text-xs font-body font-bold tracking-wide transition-all ${
              selectedTime === slot
                ? 'border-terracotta-500 bg-terracotta-500 text-cream shadow-md'
                : 'border-sand/50 hover:border-terracotta-300 hover:bg-terracotta-50 text-darkbrown/70'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BookPage() {
  const [services, setServices] = useState<Service[]>([])
  const [mobileAreas, setMobileAreas] = useState<MobileArea[]>([])
  const [gelUpgradePrice, setGelUpgradePrice] = useState(DEFAULT_GEL_UPGRADE_PRICE)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [gelUpgrades, setGelUpgrades] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'services' | 'details' | 'confirmed'>('services')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', notes: '', address: '' })
  const [locationType, setLocationType] = useState<'salon' | 'mobile'>('salon')
  const [mobileArea, setMobileArea] = useState('')

  // Logged-in customer — booking requires an account
  const [customer, setCustomer] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Calendar state
  const [viewing, setViewing] = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set())
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)

  useEffect(() => { fetch('/api/services').then(r => r.json()).then(setServices) }, [])
  useEffect(() => {
    fetch('/api/mobile-charges').then(r => r.json()).then(d => setMobileAreas(d.areas || []))
  }, [])
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (typeof d.gelUpgradePrice === 'number') setGelUpgradePrice(d.gelUpgradePrice) })
      .catch(() => {})
  }, [])

  // Check for a logged-in customer and pre-fill their details
  useEffect(() => {
    fetch('/api/customer/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d) {
          setCustomer({ name: d.name, email: d.email, phone: d.phone ?? '' })
          setForm(f => ({ ...f, name: d.name, email: d.email, phone: d.phone ?? '' }))
        }
        setAuthChecked(true)
      })
      .catch(() => setAuthChecked(true))
  }, [])

  // Scroll to top on every step change — critical on mobile
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [step])

  // Fetch unavailable dates for current viewing month
  useEffect(() => {
    const month = `${viewing.getFullYear()}-${String(viewing.getMonth() + 1).padStart(2, '0')}`
    fetch(`/api/appointments/available-dates?month=${month}`)
      .then(r => r.json())
      .then(d => setUnavailableDates(new Set(d.unavailable || [])))
      .catch(() => setUnavailableDates(new Set()))
  }, [viewing])

  // Fetch available times when date changes
  useEffect(() => {
    if (!form.date) { setAvailableTimes([]); return }
    setLoadingTimes(true)
    fetch(`/api/appointments/availability?date=${form.date}`)
      .then(r => r.json())
      .then(d => { setAvailableTimes(d.available || []); setLoadingTimes(false) })
      .catch(() => { setAvailableTimes([]); setLoadingTimes(false) })
  }, [form.date])

  const handleDateSelect = (date: string) => {
    setForm(f => ({ ...f, date, time: '' }))
  }

  const toggleService = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); setGelUpgrades(gu => { const g = new Set(gu); g.delete(id); return g }) }
      else next.add(id)
      return next
    })
  }

  const toggleGel = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setGelUpgrades(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const selectedServices = services.filter(s => selected.has(s.id))
  const gelCount = selectedServices.filter(s => gelUpgrades.has(s.id)).length
  const serviceTotal = selectedServices.reduce((sum, s) => sum + s.price, 0) + gelCount * gelUpgradePrice
  const mobileFee = locationType === 'mobile' && mobileArea
    ? (mobileAreas.find(a => a.id === mobileArea)?.fee ?? 0)
    : 0
  const grandTotal = serviceTotal + mobileFee

  const grouped = categoryOrder.reduce<Record<string, Service[]>>((acc, cat) => {
    const s = services.filter(sv => sv.category === cat)
    if (s.length) acc[cat] = s
    return acc
  }, {})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.time) { alert('Please select a date and time.'); return }
    setSubmitting(true)

    // Save appointment — identity comes from the logged-in account server-side
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date, time: form.time,
        customerPhone: form.phone,
        serviceNames: selectedServices.map(s => s.name).join(', '),
        total: grandTotal, notes: form.notes,
        locationType, mobileArea: locationType === 'mobile' ? mobileArea : '', mobileFee,
        address: locationType === 'mobile' ? form.address : '',
      }),
    })

    if (res.status === 409) {
      alert('Sorry — that time slot was just taken. Please choose another time.')
      setSubmitting(false)
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setStep('confirmed')
    setSubmitting(false)
  }

  /* ── Checking login ── */
  if (!authChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-body tracking-widest uppercase text-sm text-darkbrown/40">Loading…</p>
      </div>
    )
  }

  /* ── Login gate — booking requires an account ── */
  if (!customer) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="font-script text-teal-500 text-2xl mb-1">one moment, gorgeous</p>
        <h1 className="font-display text-4xl text-darkbrown mb-3">Log In to Book</h1>
        <div className="w-12 h-1 bg-mustard-400 mx-auto mb-6 rounded-full" />
        <p className="font-body text-sm text-darkbrown/60 leading-relaxed tracking-wide mb-8">
          Booking at Bien Bonita is exclusive to our clients. Log in to your account to book
          &mdash; or request an account and we&rsquo;ll welcome you in soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login?next=/book" className="btn-primary">Log In</Link>
          <Link href="/login?tab=register&next=/book" className="btn-secondary">Create an Account</Link>
        </div>
      </div>
    )
  }

  /* ── Confirmed ── */
  if (step === 'confirmed') {
    const mobileAreaLabel = mobileAreas.find(a => a.id === mobileArea)?.label
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-forest-100 border-2 border-forest-400 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-forest-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-script text-teal-500 text-2xl mb-1">groovy!</p>
        <h1 className="font-display text-4xl text-darkbrown mb-3">You&apos;re All Set</h1>
        <div className="w-12 h-1 bg-mustard-400 mx-auto mb-6 rounded-full" />
        <p className="text-darkbrown/60 font-body mb-8 leading-loose tracking-wide text-sm">
          Thank you, {customer.name}! We&apos;ve received your booking request and will be in touch to confirm.
        </p>
        <div className="card text-left mb-8">
          <h3 className="font-sub font-bold text-darkbrown mb-4 tracking-wide">Booking Summary</h3>
          <ul className="space-y-2 text-sm font-body">
            {selectedServices.map(s => (
              <li key={s.id}>
                <div className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-terracotta-500 font-bold">${s.price}</span>
                </div>
                {gelUpgrades.has(s.id) && (
                  <div className="flex justify-between text-xs text-teal-600 pl-3 mt-0.5">
                    <span>+ Builder Gel Upgrade</span><span>+${gelUpgradePrice}</span>
                  </div>
                )}
              </li>
            ))}
            {locationType === 'mobile' && mobileFee > 0 && (
              <li className="flex justify-between text-teal-700">
                <span>Mobile Service — {mobileAreaLabel}</span>
                <span>+${mobileFee}</span>
              </li>
            )}
          </ul>
          <div className="mt-4 pt-4 border-t border-sand/40 flex justify-between">
            <span className="font-body font-bold text-darkbrown uppercase tracking-widest text-xs pt-1">Total</span>
            <span className="font-script text-2xl text-terracotta-500">${grandTotal}</span>
          </div>
          {form.date && (
            <p className="mt-3 text-xs text-darkbrown/40 font-body tracking-wider uppercase">
              {form.date} at {formatTime(form.time)}
              {locationType === 'mobile' ? ` · Mobile (${mobileAreaLabel})` : ' · In Salon'}
            </p>
          )}
        </div>
        <Link href="/" className="btn-secondary">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">

      {/* ── Mobile sticky Continue bar ── */}
      {step === 'services' && selectedServices.length > 0 && (
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-cream/95 backdrop-blur border-b border-sand/30 shadow-sm px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-body text-xs text-darkbrown/50 uppercase tracking-widest shrink-0">{selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}</span>
            <span className="font-script text-xl text-terracotta-500 shrink-0">${grandTotal}</span>
          </div>
          <button onClick={() => setStep('details')} className="btn-primary text-xs py-2 px-5 shrink-0">Continue →</button>
        </div>
      )}

      <div className="text-center mb-10">
        <p className="font-script text-teal-500 text-2xl mb-1">let&apos;s get you booked</p>
        <h1 className="font-display text-4xl md:text-6xl text-darkbrown">Build Your Visit</h1>
        <div className="w-12 h-1 bg-mustard-400 mx-auto mt-4 rounded-full" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {(['services', 'details'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-10 h-px bg-darkbrown/20" />}
            <div className={`flex items-center gap-2 ${step === s ? 'text-terracotta-500' : 'text-darkbrown/30'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-body font-bold transition-colors ${
                step === s ? 'border-terracotta-500 bg-terracotta-500 text-cream' : 'border-darkbrown/20'
              }`}>{i + 1}</span>
              <span className="font-body text-xs tracking-widest uppercase hidden sm:inline">
                {s === 'services' ? 'Choose Services' : 'Your Details'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">

          {/* ── Step 1: Services ── */}
          {step === 'services' && (
            <div className="space-y-10">
              {Object.entries(grouped).map(([category, catServices]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-xs font-body font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full ${categoryColors[category] ?? 'bg-darkbrown text-cream'}`}>
                      {categoryLabels[category] || category}
                    </span>
                    <span className="flex-1 h-px bg-darkbrown/10" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {catServices.map(service => {
                      const isSelected = selected.has(service.id)
                      const hasGel = gelUpgrades.has(service.id)
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`text-left p-5 rounded-3xl border-2 transition-all w-full ${
                            isSelected
                              ? 'border-terracotta-400 bg-terracotta-50 shadow-[0_4px_20px_rgba(196,98,45,0.15)]'
                              : 'border-sand/40 bg-cream/80 hover:border-sand hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-sub font-bold text-darkbrown pr-2 text-base">{service.name}</h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'border-terracotta-500 bg-terracotta-500' : 'border-sand'
                            }`}>
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <p className="text-darkbrown/55 text-sm font-body mb-3 leading-relaxed">{service.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-script text-2xl text-terracotta-500">${service.price}</span>
                            <span className="text-xs text-sand font-body tracking-wider">{service.duration}</span>
                          </div>
                          {service.hasGelUpgrade && isSelected && (
                            <div className="mt-3 pt-3 border-t border-terracotta-100">
                              <button
                                onClick={(e) => toggleGel(e, service.id)}
                                className={`w-full flex items-center justify-between px-4 py-2 rounded-full border-2 text-xs font-body font-bold tracking-wider uppercase transition-all ${
                                  hasGel
                                    ? 'border-forest-500 bg-forest-500 text-cream'
                                    : 'border-sand text-darkbrown/60 hover:border-darkbrown/30'
                                }`}
                              >
                                <span>{hasGel ? '✓ Builder Gel Upgrade Added' : '+ Add Builder Gel Upgrade'}</span>
                                <span className={hasGel ? 'text-cream/70' : 'text-terracotta-500'}>+${gelUpgradePrice}</span>
                              </button>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Location type */}
              <div className="card">
                <p className="font-script text-teal-500 text-xl mb-3">where are we meeting?</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['salon', 'mobile'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setLocationType(type); if (type === 'salon') setMobileArea('') }}
                      className={`py-3 px-4 rounded-2xl border-2 text-sm font-body font-bold tracking-wide transition-all ${
                        locationType === type
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-sand/40 text-darkbrown/50 hover:border-sand'
                      }`}
                    >
                      {type === 'salon' ? '🏠 In Salon' : '🚗 Mobile Service'}
                    </button>
                  ))}
                </div>

                {locationType === 'mobile' && (
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-2">Select Your Area *</label>
                    <div className="space-y-2">
                      {mobileAreas.map(area => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => setMobileArea(area.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-sm font-body transition-all ${
                            mobileArea === area.id
                              ? 'border-terracotta-400 bg-terracotta-50 text-darkbrown'
                              : 'border-sand/40 text-darkbrown/60 hover:border-sand'
                          }`}
                        >
                          <span className="font-bold">{area.label}</span>
                          <span className="text-terracotta-500 font-bold">+${area.fee}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Your Address *</label>
                      <input
                        type="text" required
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        className="input-field"
                        placeholder="Street address, city, ZIP"
                      />
                      <p className="font-body text-[11px] text-darkbrown/30 mt-1">So we know exactly where to bring the salon to you.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Date picker */}
              <div className="card">
                <p className="font-script text-teal-500 text-xl mb-1">pick a date</p>
                <p className="font-body text-xs text-darkbrown/40 tracking-widest uppercase mb-4">
                  Crossed-out dates are unavailable
                </p>
                <BookingCalendar
                  unavailableDates={unavailableDates}
                  selectedDate={form.date}
                  onSelectDate={handleDateSelect}
                  viewing={viewing}
                  onPrev={() => setViewing(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                  onNext={() => setViewing(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                />
              </div>

              {/* Time picker — only shows after date selected */}
              {form.date && (
                <div className="card">
                  <p className="font-script text-teal-500 text-xl mb-1">choose a time</p>
                  <p className="font-body text-xs text-darkbrown/40 tracking-widest uppercase mb-4">
                    {new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <TimeSlotPicker
                    availableSlots={availableTimes}
                    selectedTime={form.time}
                    onSelect={t => setForm(f => ({ ...f, time: t }))}
                    loading={loadingTimes}
                  />
                </div>
              )}

              {/* Booking as + notes */}
              <div className="card space-y-5">
                <p className="font-script text-teal-500 text-xl mb-0">almost done!</p>
                <div className="bg-parchment/60 rounded-2xl px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-widest text-darkbrown/40 font-bold mb-1">Booking As</p>
                    <p className="font-sub font-bold text-darkbrown text-sm">{customer.name}</p>
                    <p className="font-body text-xs text-darkbrown/50 mt-0.5">
                      ✉ {customer.email}{customer.phone ? ` · 📞 ${customer.phone}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch('/api/customer/logout', { method: 'POST' })
                      window.location.reload()
                    }}
                    className="font-body text-[10px] font-bold uppercase tracking-widest text-darkbrown/40 hover:text-terracotta-500 transition-colors shrink-0 mt-0.5"
                  >
                    Log Out
                  </button>
                </div>
                {!customer.phone && (
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Phone *</label>
                    <input type="tel" required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="(555) 123-4567" />
                    <p className="font-body text-[11px] text-darkbrown/30 mt-1">We&rsquo;ll save this to your account for next time.</p>
                  </div>
                )}
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Notes / Special Requests</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-28 resize-none" placeholder="Design ideas, or a link to your inspo: ex Pinterest or Instagram!"/>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setStep('services')} className="btn-secondary flex-1">Back</button>
                <button
                  type="submit"
                  disabled={submitting || !form.date || !form.time || (locationType === 'mobile' && (!mobileArea || !form.address.trim()))}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  {submitting ? 'Sending…' : 'Submit Booking'}
                </button>
              </div>
              {locationType === 'mobile' && !mobileArea && (
                <p className="text-xs font-body text-center text-darkbrown/40">Please select your mobile service area above.</p>
              )}
            </form>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <p className="font-script text-teal-500 text-lg mb-0">yes queen!</p>
            <h3 className="font-display text-xl text-darkbrown mb-1">Selections</h3>
            <div className="h-0.5 w-8 bg-mustard-400 mb-4 rounded-full" />
            {selectedServices.length === 0 ? (
              <p className="text-darkbrown/40 font-body text-sm italic tracking-wide">Select services to get started</p>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {selectedServices.map(s => (
                    <li key={s.id} className="text-sm font-body">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-darkbrown font-bold">{s.name}</p>
                          <p className="text-sand text-xs">{s.duration}</p>
                        </div>
                        <span className="text-terracotta-500 font-bold">${s.price}</span>
                      </div>
                      {gelUpgrades.has(s.id) && (
                        <div className="flex justify-between text-xs text-teal-600 pl-2 mt-1">
                          <span>+ Builder Gel Upgrade</span><span>+${gelUpgradePrice}</span>
                        </div>
                      )}
                    </li>
                  ))}
                  {locationType === 'mobile' && mobileArea && mobileFee > 0 && (
                    <li className="text-sm font-body">
                      <div className="flex items-start justify-between pt-2 border-t border-sand/20">
                        <div>
                          <p className="text-teal-700 font-bold">Mobile Service</p>
                          <p className="text-sand text-xs">{mobileAreas.find(a => a.id === mobileArea)?.label}</p>
                        </div>
                        <span className="text-teal-600 font-bold">+${mobileFee}</span>
                      </div>
                    </li>
                  )}
                </ul>
                <div className="pt-4 border-t border-sand/40 flex justify-between items-center">
                  <span className="font-body uppercase tracking-widest text-xs text-darkbrown/50">Est. Total</span>
                  <span className="font-script text-3xl text-terracotta-500">${grandTotal}</span>
                </div>
              </>
            )}
            {step === 'services' && selectedServices.length > 0 && (
              <button onClick={() => setStep('details')} className="btn-primary w-full mt-6">Continue</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
