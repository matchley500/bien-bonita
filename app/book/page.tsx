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
  manicure:   'Manicures',
  pedicure:   'Pedicures',
  gel:        'Gel Polish',
  extensions: 'Extensions',
  removals:   'Removals',
  designs:    'Designs',
  addons:     'Add-Ons',
}

const categoryColors: Record<string, string> = {
  manicure:   'bg-terracotta-500 text-cream',
  pedicure:   'bg-teal-500 text-cream',
  gel:        'bg-forest-500 text-cream',
  extensions: 'bg-mustard-500 text-darkbrown',
  removals:   'bg-terracotta-700 text-cream',
  designs:    'bg-teal-600 text-cream',
  addons:     'bg-forest-600 text-cream',
}

const categoryOrder = ['manicure', 'pedicure', 'gel', 'extensions', 'removals', 'designs', 'addons']
const GEL_UPGRADE_PRICE = 15

function buildTimeSlots(): { value: string; label: string }[] {
  const slots = []
  let h = 8, m = 30
  while (h < 16 || (h === 16 && m === 0)) {
    const period = h < 12 ? 'AM' : 'PM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    const displayM = m === 0 ? '00' : '30'
    slots.push({ value: `${String(h).padStart(2,'0')}:${displayM}`, label: `${displayH}:${displayM} ${period}` })
    m += 30; if (m === 60) { m = 0; h++ }
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', notes: '' })

  useEffect(() => { fetch('/api/services').then(r => r.json()).then(setServices) }, [])

  const toggleService = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setGelUpgrades(gu => { const g = new Set(gu); g.delete(id); return g })
      } else { next.add(id) }
      return next
    })
  }

  const toggleGel = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setGelUpgrades(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const selectedServices = services.filter(s => selected.has(s.id))
  const gelCount = selectedServices.filter(s => gelUpgrades.has(s.id)).length
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0) + gelCount * GEL_UPGRADE_PRICE

  const grouped = categoryOrder.reduce<Record<string, Service[]>>((acc, cat) => {
    const s = services.filter(sv => sv.category === cat)
    if (s.length) acc[cat] = s
    return acc
  }, {})

  const formatTime = (val: string) => TIME_SLOTS.find(s => s.value === val)?.label ?? val

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const servicesList = selectedServices.map(s => {
      const gel = gelUpgrades.has(s.id) ? ` + Gel Upgrade (+$${GEL_UPGRADE_PRICE})` : ''
      return `${s.name}${gel} — $${s.price}${gelUpgrades.has(s.id) ? ` + $${GEL_UPGRADE_PRICE}` : ''}`
    }).join('\n')

    const emailParams = {
      customer_name: form.name, customer_email: form.email, customer_phone: form.phone,
      preferred_date: form.date, preferred_time: formatTime(form.time),
      services: servicesList, total: `$${total}`, notes: form.notes || 'None',
    }

    const sid = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
    const tid = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
    const key = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    if (sid && tid && key) {
      try { const ejs = await import('@emailjs/browser'); await ejs.send(sid, tid, emailParams, key) }
      catch (err) { console.error('EmailJS error:', err) }
    } else { console.log('Booking (EmailJS not configured):', emailParams) }

    setStep('confirmed')
    setSubmitting(false)
  }

  /* ── Confirmed ── */
  if (step === 'confirmed') {
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
          Thank you, {form.name}! We&apos;ve received your booking request and will be in touch to confirm your appointment.
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
                    <span>+ Gel Upgrade</span><span>+${GEL_UPGRADE_PRICE}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-sand/40 flex justify-between">
            <span className="font-body font-bold text-darkbrown uppercase tracking-widest text-xs pt-1">Total</span>
            <span className="font-script text-2xl text-terracotta-500">${total}</span>
          </div>
          {form.date && (
            <p className="mt-3 text-xs text-darkbrown/40 font-body tracking-wider uppercase">
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

          {/* ── Step 1 ── */}
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
                                <span>{hasGel ? '✓ Gel Upgrade Added' : '+ Add Gel Upgrade'}</span>
                                <span className={hasGel ? 'text-cream/70' : 'text-terracotta-500'}>+${GEL_UPGRADE_PRICE}</span>
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

          {/* ── Step 2 ── */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="card space-y-5">
              <div>
                <p className="font-script text-teal-500 text-xl mb-0">share your deets</p>
                
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Your name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="input-field" placeholder="you@email.com" />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Phone *</label>
                  <input type="tel" required value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="input-field" placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Preferred Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="input-field" />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Preferred Time</label>
                  <select value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))} className="input-field">
                    <option value="">Select a time…</option>
                    {TIME_SLOTS.map(slot => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Notes / Special Requests</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="input-field h-28 resize-none" placeholder="Design ideas, allergies, anything we should know…" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setStep('services')} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? 'Sending…' : 'Submit Booking'}
                </button>
              </div>
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
                          <span>+ Gel Upgrade</span><span>+${GEL_UPGRADE_PRICE}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-sand/40 flex justify-between items-center">
                  <span className="font-body uppercase tracking-widest text-xs text-darkbrown/50">Est. Total</span>
                  <span className="font-script text-3xl text-terracotta-500">${total}</span>
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
