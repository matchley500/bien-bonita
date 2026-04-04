'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  category: string
  hasGelUpgrade?: boolean
}

const categoryLabels: Record<string, string> = {
  manicure: 'Manicures',
  pedicure: 'Pedicures',
  gel: 'Gel Polish',
  extensions: 'Extensions',
  removals: 'Removals',
  designs: 'Designs',
  addons: 'Add-Ons',
}

const categoryOrder = ['manicure', 'pedicure', 'gel', 'extensions', 'removals', 'designs', 'addons']

const GEL_UPGRADE_PRICE = 15

// Build 8:30 AM – 4:00 PM in 30-min slots
function buildTimeSlots(): { value: string; label: string }[] {
  const slots = []
  const start = { h: 8, m: 30 }
  const end = { h: 16, m: 0 }
  let { h, m } = start
  while (h < end.h || (h === end.h && m <= end.m)) {
    const period = h < 12 ? 'AM' : 'PM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    const displayM = m === 0 ? '00' : '30'
    const label = `${displayH}:${displayM} ${period}`
    const value = `${String(h).padStart(2, '0')}:${displayM}`
    slots.push({ value, label })
    m += 30
    if (m === 60) { m = 0; h++ }
  }
  return slots
}

const TIME_SLOTS = buildTimeSlots()

export default function BookPage() {
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [gelUpgrades, setGelUpgrades] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'services' | 'details' | 'confirmed'>('services')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices)
  }, [])

  const toggleService = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setGelUpgrades(gu => { const g = new Set(gu); g.delete(id); return g })
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleGel = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setGelUpgrades(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedServices = services.filter(s => selected.has(s.id))
  const gelCount = selectedServices.filter(s => gelUpgrades.has(s.id)).length
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0) + gelCount * GEL_UPGRADE_PRICE

  const grouped = categoryOrder.reduce<Record<string, Service[]>>((acc, cat) => {
    const catServices = services.filter(s => s.category === cat)
    if (catServices.length) acc[cat] = catServices
    return acc
  }, {})

  const formatTime = (val: string) => {
    const slot = TIME_SLOTS.find(s => s.value === val)
    return slot ? slot.label : val
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const servicesList = selectedServices
      .map(s => {
        const gel = gelUpgrades.has(s.id) ? ` + Gel Upgrade (+$${GEL_UPGRADE_PRICE})` : ''
        return `${s.name}${gel} — $${s.price}${gelUpgrades.has(s.id) ? ` (+$${GEL_UPGRADE_PRICE})` : ''}`
      })
      .join('\n')

    const emailParams = {
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      preferred_date: form.date,
      preferred_time: formatTime(form.time),
      services: servicesList,
      total: `$${total}`,
      notes: form.notes || 'None',
    }

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

    if (serviceId && templateId && publicKey) {
      try {
        const emailjs = await import('@emailjs/browser')
        await emailjs.send(serviceId, templateId, emailParams, publicKey)
      } catch (err) {
        console.error('EmailJS error:', err)
      }
    } else {
      console.log('Booking request (EmailJS not configured):', emailParams)
    }

    setStep('confirmed')
    setSubmitting(false)
  }

  if (step === 'confirmed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-sage-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-4xl text-darkbrown italic mb-4">Booking Received!</h1>
        <p className="text-sand-500 font-body text-lg mb-6">
          Thank you, {form.name}! We&apos;ve received your booking request and will be in touch soon to confirm your appointment.
        </p>
        <div className="card text-left mb-8">
          <h3 className="font-body font-bold text-darkbrown mb-3">Your Booking Summary</h3>
          <ul className="space-y-2 text-sm text-sand-600 font-body">
            {selectedServices.map(s => (
              <li key={s.id}>
                <div className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-terracotta-500 font-semibold">${s.price}</span>
                </div>
                {gelUpgrades.has(s.id) && (
                  <div className="flex justify-between text-xs text-sage-500 pl-3 mt-0.5">
                    <span>+ Gel Upgrade</span>
                    <span>+${GEL_UPGRADE_PRICE}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-sand-100 flex justify-between font-body font-bold text-darkbrown">
            <span>Total</span>
            <span className="text-terracotta-500 font-display text-xl">${total}</span>
          </div>
          {form.date && (
            <p className="mt-3 text-sm text-sand-500">
              Preferred: {form.date}{form.time ? ` at ${formatTime(form.time)}` : ''}
            </p>
          )}
        </div>
        <Link href="/" className="btn-secondary">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <div className="text-center mb-10">
        <p className="text-terracotta-500 font-body tracking-[0.2em] uppercase text-sm mb-2">
          Book Your Session
        </p>
        <h1 className="font-display text-3xl md:text-5xl text-darkbrown italic">
          Build Your Perfect Visit
        </h1>
        <div className="mt-4 w-20 h-0.5 bg-gold mx-auto" />
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <div className={`flex items-center gap-2 ${step === 'services' ? 'text-terracotta-500' : 'text-sage-500'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'services' ? 'bg-terracotta-500 text-white' : 'bg-sage-100 text-sage-500'
          }`}>1</span>
          <span className="font-body text-sm hidden sm:inline">Choose Services</span>
        </div>
        <div className="w-12 h-px bg-sand-200" />
        <div className={`flex items-center gap-2 ${step === 'details' ? 'text-terracotta-500' : 'text-sand-300'}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step === 'details' ? 'bg-terracotta-500 text-white' : 'bg-sand-100 text-sand-300'
          }`}>2</span>
          <span className="font-body text-sm hidden sm:inline">Your Details</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">

          {/* ── Step 1: Service Selection ── */}
          {step === 'services' && (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, categoryServices]) => (
                <div key={category}>
                  <h2 className="font-display text-xl text-darkbrown mb-4 flex items-center gap-2">
                    {categoryLabels[category] || category}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {categoryServices.map(service => {
                      const isSelected = selected.has(service.id)
                      const hasGel = gelUpgrades.has(service.id)
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`text-left p-5 rounded-2xl border-2 transition-all w-full ${
                            isSelected
                              ? 'border-terracotta-500 bg-terracotta-50 shadow-md'
                              : 'border-sand-100 bg-white hover:border-sand-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-body font-bold text-darkbrown pr-2">{service.name}</h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'border-terracotta-500 bg-terracotta-500'
                                : 'border-sand-300'
                            }`}>
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>

                          <p className="text-sand-500 text-sm font-body mb-3 leading-relaxed">
                            {service.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="font-display text-xl text-terracotta-500">${service.price}</span>
                            <span className="text-xs text-sand-400 font-body">{service.duration}</span>
                          </div>

                          {/* Gel upgrade toggle — only shown when card is selected */}
                          {service.hasGelUpgrade && isSelected && (
                            <div className="mt-3 pt-3 border-t border-terracotta-100">
                              <button
                                onClick={(e) => toggleGel(e, service.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
                                  hasGel
                                    ? 'bg-sage-500 text-white'
                                    : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                                }`}
                              >
                                <span>{hasGel ? '✓ Gel Upgrade Added' : '+ Add Gel Upgrade'}</span>
                                <span className={hasGel ? 'text-sage-100' : 'text-terracotta-500'}>
                                  +${GEL_UPGRADE_PRICE}
                                </span>
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

          {/* ── Step 2: Customer Details ── */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="card space-y-5">
              <h2 className="font-display text-xl text-darkbrown mb-2">Your Information</h2>

              <div>
                <label className="block font-body text-sm text-sand-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-sand-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-field"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm text-sand-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input-field"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-sand-600 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm text-sand-600 mb-1">Preferred Time</label>
                  <select
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select a time…</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-body text-sm text-sand-600 mb-1">Notes / Special Requests</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field h-28 resize-none"
                  placeholder="Any design ideas, allergies, or things we should know…"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('services')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {submitting ? 'Sending…' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Sidebar: Order Summary ── */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h3 className="font-display text-lg text-darkbrown mb-4">Your Selection</h3>

            {selectedServices.length === 0 ? (
              <p className="text-sand-400 font-body text-sm italic">
                Select services to get started
              </p>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {selectedServices.map(s => (
                    <li key={s.id} className="text-sm font-body">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-darkbrown font-semibold">{s.name}</p>
                          <p className="text-sand-400 text-xs">{s.duration}</p>
                        </div>
                        <span className="text-terracotta-500 font-semibold">${s.price}</span>
                      </div>
                      {gelUpgrades.has(s.id) && (
                        <div className="flex justify-between text-xs text-sage-500 pl-2 mt-1">
                          <span>+ Gel Upgrade</span>
                          <span>+${GEL_UPGRADE_PRICE}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-sand-100">
                  <div className="flex justify-between font-body">
                    <span className="font-bold text-darkbrown">Estimated Total</span>
                    <span className="font-bold text-terracotta-500 text-xl font-display">${total}</span>
                  </div>
                </div>
              </>
            )}

            {step === 'services' && selectedServices.length > 0 && (
              <button
                onClick={() => setStep('details')}
                className="btn-primary w-full mt-6"
              >
                Continue to Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
