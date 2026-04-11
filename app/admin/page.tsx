'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: string; name: string; description: string
  price: number; duration: string; category: string
}
interface Appointment {
  id: string; date: string; time: string
  customerName: string; customerEmail: string; customerPhone: string
  serviceNames: string; total: number; notes: string
  locationType?: string; mobileArea?: string; mobileFee?: number
  createdAt: string
}
interface MobileArea { id: string; label: string; fee: number }
interface BlockedData {
  dates: string[]
  slots: { date: string; time: string }[]
  weekdays: number[] // 0=Sun … 6=Sat
}

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'manicure', label: 'Manicures' }, { value: 'pedicure', label: 'Pedicures' },
  { value: 'gel', label: 'Gel Polish' }, { value: 'extensions', label: 'Extensions' },
  { value: 'removals', label: 'Removals' }, { value: 'designs', label: 'Designs' },
  { value: 'addons', label: 'Add-Ons' },
]
const EMPTY_SVC = { name: '', description: '', price: '', duration: '', category: 'manicure' }
const EMPTY_APPT = { date: '', time: '', customerName: '', customerEmail: '', customerPhone: '', serviceNames: '', total: '', notes: '' }

function buildTimeSlots() {
  const slots: { value: string; label: string }[] = []
  let h = 8, m = 30
  while (h < 16 || (h === 16 && m === 0)) {
    const period = h < 12 ? 'AM' : 'PM'
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
    const dm = m === 0 ? '00' : '30'
    slots.push({ value: `${String(h).padStart(2, '0')}:${dm}`, label: `${dh}:${dm} ${period}` })
    m += 30; if (m === 60) { m = 0; h++ }
  }
  return slots
}
const TIME_SLOTS = buildTimeSlots()
function fmtTime(val: string) { return TIME_SLOTS.find(s => s.value === val)?.label ?? val }
function fmtDate(d: string) {
  if (!d) return ''
  const [y, mo, day] = d.split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}
function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ── Mini Calendar (shared) ───────────────────────────────────────────────────
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function MiniCalendar({
  markers = {},
  blockedWeekdays = [],
  selectedDate,
  onSelectDate,
}: {
  markers?: Record<string, 'appt' | 'blocked' | 'both'>
  blockedWeekdays?: number[]
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const today = new Date()
  const [viewing, setViewing] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const year = viewing.getFullYear(); const month = viewing.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewing(new Date(year, month - 1, 1))} className="w-9 h-9 rounded-full hover:bg-parchment flex items-center justify-center text-darkbrown/60 hover:text-darkbrown text-lg">‹</button>
        <p className="font-sub font-bold text-darkbrown text-sm tracking-wide">
          {viewing.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button onClick={() => setViewing(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-full hover:bg-parchment flex items-center justify-center text-darkbrown/60 hover:text-darkbrown text-lg">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className={`text-center text-[10px] font-body font-bold uppercase tracking-widest py-1 rounded-sm
            ${blockedWeekdays.includes(i) ? 'text-red-400 bg-red-50' : 'text-darkbrown/30'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const key = toKey(year, month + 1, day)
          const dow = new Date(year, month, day).getDay()
          const isWeekdayBlocked = blockedWeekdays.includes(dow)
          const marker = markers[key]
          const isSelected = key === selectedDate
          const isToday = key === todayKey
          return (
            <button key={day} onClick={() => onSelectDate(isSelected ? '' : key)}
              className={`relative mx-auto w-9 h-9 rounded-full text-xs font-body flex items-center justify-center transition-all
                ${isSelected ? 'bg-terracotta-500 text-cream font-bold shadow' :
                  isWeekdayBlocked ? 'bg-red-50 text-red-300 line-through' :
                  isToday ? 'border-2 border-terracotta-400 text-terracotta-600 font-bold hover:bg-terracotta-50' :
                  'hover:bg-parchment text-darkbrown/70'}`}
            >
              {day}
              {marker && !isSelected && !isWeekdayBlocked && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full
                  ${marker === 'blocked' ? 'bg-red-400' : 'bg-green-500'}`} />
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-sand/30 flex flex-wrap gap-3 text-[10px] font-body text-darkbrown/40">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Appointments</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Blocked</span>
        {blockedWeekdays.length > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-200 inline-block" />Recurring block</span>}
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState<'appointments' | 'availability' | 'services' | 'mobile'>('appointments')
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [mobileAreas, setMobileAreas] = useState<MobileArea[]>([])
  const [blocked, setBlocked] = useState<BlockedData>({ dates: [], slots: [], weekdays: [] })
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [selectedDate, setSelectedDate] = useState('')

  // Service form
  const [showSvcForm, setShowSvcForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [svcForm, setSvcForm] = useState(EMPTY_SVC)
  const [savingSvc, setSavingSvc] = useState(false)

  // Appointment form
  const [showApptForm, setShowApptForm] = useState(false)
  const [apptForm, setApptForm] = useState(EMPTY_APPT)
  const [savingAppt, setSavingAppt] = useState(false)

  // Availability / block form
  const [blockDate, setBlockDate] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [blockType, setBlockType] = useState<'date' | 'slot'>('date')
  const [savingBlock, setSavingBlock] = useState(false)

  // Mobile charges editing
  const [mobileEdits, setMobileEdits] = useState<MobileArea[]>([])
  const [savingMobile, setSavingMobile] = useState(false)
  const [mobileSaved, setMobileSaved] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/check').then(res => {
      if (!res.ok) { router.push('/admin/login'); return }
      setAuthenticated(true)
      Promise.all([
        fetch('/api/services').then(r => r.json()),
        fetch('/api/admin/appointments').then(r => r.json()),
        fetch('/api/admin/mobile-charges').then(r => r.json()),
        fetch('/api/admin/blocked').then(r => r.json()),
      ]).then(([svcs, apts, mob, blk]) => {
        setServices(svcs)
        setAppointments(apts)
        const areas = mob.areas || []
        setMobileAreas(areas)
        setMobileEdits(areas.map((a: MobileArea) => ({ ...a })))
        setBlocked(blk)
      })
    })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }); router.push('/')
  }

  const refreshAppointments = async () => setAppointments(await fetch('/api/admin/appointments').then(r => r.json()))
  const refreshServices = async () => setServices(await fetch('/api/services').then(r => r.json()))
  const refreshBlocked = async () => setBlocked(await fetch('/api/admin/blocked').then(r => r.json()))

  // ── Service actions ──
  const handleSvcSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingSvc(true)
    await fetch(editingId ? `/api/admin/services/${editingId}` : '/api/admin/services', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(svcForm),
    })
    await refreshServices()
    setSvcForm(EMPTY_SVC); setEditingId(null); setShowSvcForm(false); setSavingSvc(false)
  }
  const handleSvcEdit = (s: Service) => {
    setSvcForm({ name: s.name, description: s.description, price: String(s.price), duration: s.duration, category: s.category })
    setEditingId(s.id); setShowSvcForm(true)
  }
  const handleSvcDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' }); await refreshServices()
  }

  // ── Appointment actions ──
  const handleApptSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingAppt(true)
    await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apptForm, total: Number(apptForm.total) || 0 }),
    })
    await refreshAppointments()
    setApptForm(EMPTY_APPT); setShowApptForm(false); setSavingAppt(false)
  }
  const handleApptDelete = async (id: string) => {
    if (!confirm('Cancel this appointment? This will free up the time slot.')) return
    await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' })
    await refreshAppointments()
  }

  // ── Block actions ──
  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingBlock(true)
    const body = blockType === 'date'
      ? { type: 'date', date: blockDate }
      : { type: 'slot', date: blockDate, time: blockTime }
    await fetch('/api/admin/blocked', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    await refreshBlocked()
    setBlockDate(''); setBlockTime(''); setSavingBlock(false)
  }
  const handleUnblock = async (type: 'date' | 'slot', date: string, time?: string) => {
    await fetch('/api/admin/blocked', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(type === 'date' ? { type: 'date', date } : { type: 'slot', date, time }),
    })
    await refreshBlocked()
  }

  // ── Mobile charges ──
  const handleMobileSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingMobile(true)
    await fetch('/api/admin/mobile-charges', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areas: mobileEdits }),
    })
    const mob = await fetch('/api/admin/mobile-charges').then(r => r.json())
    setMobileAreas(mob.areas || []); setSavingMobile(false)
    setMobileSaved(true); setTimeout(() => setMobileSaved(false), 2500)
  }

  // ── Derived ──
  const apptDateSet = new Set(appointments.map(a => a.date))
  const blockedDateSet = new Set(blocked.dates)
  const calMarkers: Record<string, 'appt' | 'blocked' | 'both'> = {}
  apptDateSet.forEach(d => { calMarkers[d] = blockedDateSet.has(d) ? 'both' : 'appt' })
  blockedDateSet.forEach(d => { if (!calMarkers[d]) calMarkers[d] = 'blocked' })

  const dayAppointments = selectedDate
    ? appointments.filter(a => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time))
    : []
  const dayBlockedSlots = selectedDate
    ? blocked.slots.filter(s => s.date === selectedDate).map(s => s.time)
    : []
  const isDayBlocked = blocked.dates.includes(selectedDate)

  if (authenticated === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="font-body tracking-widest uppercase text-sm text-darkbrown/40">Loading…</p></div>
  }

  const tabConfig = [
    { key: 'appointments', label: `Appointments${appointments.length ? ` (${appointments.length})` : ''}` },
    { key: 'availability', label: 'Availability' },
    { key: 'services', label: 'Services' },
    { key: 'mobile', label: 'Mobile Charges' },
  ] as const

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-script text-teal-500 text-xl">admin</p>
          <h1 className="font-display text-4xl text-darkbrown">Dashboard</h1>
          <div className="h-0.5 w-10 bg-mustard-400 mt-2 rounded-full" />
        </div>
        <button onClick={handleLogout} className="btn-secondary text-xs">Logout</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-8 bg-parchment rounded-2xl p-1 w-fit">
        {tabConfig.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl font-body text-xs uppercase tracking-widest transition-all ${
              tab === t.key ? 'bg-darkbrown text-cream shadow-sm' : 'text-darkbrown/50 hover:text-darkbrown'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════ APPOINTMENTS TAB ════════════════ */}
      {tab === 'appointments' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <MiniCalendar markers={calMarkers} blockedWeekdays={blocked.weekdays} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <button
              onClick={() => { setApptForm({ ...EMPTY_APPT, date: selectedDate }); setShowApptForm(!showApptForm) }}
              className="btn-primary w-full text-xs"
            >
              {showApptForm ? 'Cancel' : '+ Add Appointment'}
            </button>

            {showApptForm && (
              <form onSubmit={handleApptSave} className="card space-y-3">
                <h3 className="font-display text-xl text-darkbrown">New Appointment</h3>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Client Name *</label>
                  <input type="text" required value={apptForm.customerName} onChange={e => setApptForm(f => ({ ...f, customerName: e.target.value }))} className="input-field" placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Date *</label>
                    <input type="date" required value={apptForm.date} onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Time *</label>
                    <select required value={apptForm.time} onChange={e => setApptForm(f => ({ ...f, time: e.target.value }))} className="input-field">
                      <option value="">Select…</option>
                      {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Phone</label>
                  <input type="tel" value={apptForm.customerPhone} onChange={e => setApptForm(f => ({ ...f, customerPhone: e.target.value }))} className="input-field" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Services</label>
                  <input type="text" value={apptForm.serviceNames} onChange={e => setApptForm(f => ({ ...f, serviceNames: e.target.value }))} className="input-field" placeholder="e.g. Spa Manicure, Gel Polish" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Total ($)</label>
                    <input type="number" min="0" value={apptForm.total} onChange={e => setApptForm(f => ({ ...f, total: e.target.value }))} className="input-field" placeholder="0" />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Notes</label>
                    <input type="text" value={apptForm.notes} onChange={e => setApptForm(f => ({ ...f, notes: e.target.value }))} className="input-field" placeholder="Optional" />
                  </div>
                </div>
                <button type="submit" disabled={savingAppt} className="btn-primary w-full disabled:opacity-50">
                  {savingAppt ? 'Saving…' : 'Save Appointment'}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {isDayBlocked && (
                      <span className="inline-block mb-2 text-xs font-body font-bold uppercase tracking-widest bg-red-100 text-red-600 px-3 py-1 rounded-full">Day Blocked</span>
                    )}
                    <p className="font-script text-teal-500 text-lg">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</p>
                    <h2 className="font-display text-2xl text-darkbrown">{fmtDate(selectedDate)}</h2>
                  </div>
                  <button onClick={() => setSelectedDate('')} className="text-xs font-body text-darkbrown/40 hover:text-darkbrown uppercase tracking-widest">Clear</button>
                </div>

                {dayAppointments.length === 0 && dayBlockedSlots.length === 0 && !isDayBlocked ? (
                  <div className="card text-center py-10">
                    <p className="font-body text-darkbrown/40 text-sm tracking-wide">No appointments on this day.</p>
                    <button onClick={() => { setApptForm({ ...EMPTY_APPT, date: selectedDate }); setShowApptForm(true) }} className="mt-4 text-xs font-body font-bold text-terracotta-500 uppercase tracking-wider hover:underline">+ Add one</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayAppointments.map(appt => (
                      <div key={appt.id} className="card flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl px-4 py-3 text-center min-w-[90px]">
                          <p className="font-display text-xl text-terracotta-500 leading-tight">{fmtTime(appt.time)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-sub font-bold text-darkbrown text-base">{appt.customerName}</p>
                              {appt.serviceNames && <p className="text-xs font-body text-teal-600 mt-0.5">{appt.serviceNames}</p>}
                              {appt.locationType === 'mobile' && appt.mobileArea && (
                                <p className="text-xs font-body text-mustard-600 mt-0.5">🚗 Mobile — {appt.mobileArea}{appt.mobileFee ? ` (+$${appt.mobileFee})` : ''}</p>
                              )}
                            </div>
                            {appt.total > 0 && <span className="font-script text-xl text-terracotta-500 shrink-0">${appt.total}</span>}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-body text-darkbrown/50">
                            {appt.customerPhone && <span>📞 {appt.customerPhone}</span>}
                            {appt.customerEmail && <span>✉ {appt.customerEmail}</span>}
                          </div>
                          {appt.notes && <p className="mt-2 text-xs font-body text-darkbrown/40 italic">{appt.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleApptDelete(appt.id)}
                          className="shrink-0 text-xs font-body font-bold text-darkbrown/25 hover:text-red-500 uppercase tracking-wider transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}

                    {dayBlockedSlots.length > 0 && (
                      <div className="card border-red-200 bg-red-50/50">
                        <p className="font-body text-xs uppercase tracking-widest text-red-400 font-bold mb-2">Blocked Time Slots</p>
                        <div className="flex flex-wrap gap-2">
                          {dayBlockedSlots.map(t => (
                            <span key={t} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-body font-bold">
                              {fmtTime(t)}
                              <button onClick={() => handleUnblock('slot', selectedDate, t)} className="text-red-400 hover:text-red-700 ml-1">✕</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="card text-center py-16">
                <p className="font-script text-teal-400 text-2xl mb-2">pick a day</p>
                <p className="font-body text-darkbrown/40 text-sm tracking-wide">Select a date on the calendar to view appointments.</p>
                {appointments.length > 0 && (
                  <div className="mt-8 text-left max-h-96 overflow-y-auto space-y-1">
                    <p className="font-body text-xs uppercase tracking-widest text-darkbrown/30 mb-3">All Upcoming</p>
                    {[...appointments]
                      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                      .map(appt => (
                        <button key={appt.id} onClick={() => setSelectedDate(appt.date)}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-parchment transition-colors"
                        >
                          <div className="text-center min-w-[52px]">
                            <p className="font-body text-xs text-darkbrown/40 uppercase tracking-wide">
                              {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className="font-display text-xl text-darkbrown leading-none">
                              {new Date(appt.date + 'T00:00:00').getDate()}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-sub font-bold text-darkbrown text-sm truncate">{appt.customerName}</p>
                            <p className="text-xs font-body text-darkbrown/40">{fmtTime(appt.time)}{appt.serviceNames ? ` · ${appt.serviceNames}` : ''}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ AVAILABILITY TAB ════════════════ */}
      {tab === 'availability' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Recurring weekday blocks */}
            <div className="card">
              <p className="font-script text-teal-500 text-xl mb-1">recurring days</p>
              <p className="font-body text-xs text-darkbrown/40 tracking-wide mb-4">
                Block an entire day of the week indefinitely. Tap to toggle.
              </p>
              <div className="grid grid-cols-7 gap-1">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, dow) => {
                  const isBlocked = blocked.weekdays.includes(dow)
                  return (
                    <button
                      key={dow}
                      onClick={async () => {
                        const method = isBlocked ? 'DELETE' : 'POST'
                        await fetch('/api/admin/blocked', {
                          method,
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ type: 'weekday', day: dow }),
                        })
                        await refreshBlocked()
                      }}
                      title={isBlocked ? `Unblock all ${label}s` : `Block all ${label}s`}
                      className={`flex flex-col items-center py-2 px-0.5 rounded-xl border-2 text-[10px] font-body font-bold tracking-wide transition-all ${
                        isBlocked
                          ? 'border-red-400 bg-red-50 text-red-600'
                          : 'border-sand/40 text-darkbrown/50 hover:border-red-200 hover:bg-red-50/40 hover:text-red-400'
                      }`}
                    >
                      {label}
                      {isBlocked && <span className="text-[8px] mt-0.5 text-red-400 font-normal">off</span>}
                    </button>
                  )
                })}
              </div>
              {blocked.weekdays.length > 0 && (
                <p className="mt-3 text-[10px] font-body text-red-400 tracking-wide">
                  {blocked.weekdays.sort().map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')} blocked every week.
                </p>
              )}
            </div>

            {/* Specific date/slot block form */}
            <div className="card">
              <p className="font-script text-teal-500 text-xl mb-1">block off time</p>
              <p className="font-body text-xs text-darkbrown/40 tracking-wide mb-4">Customers won&apos;t be able to book blocked dates or slots.</p>
              <form onSubmit={handleBlock} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 mb-1">
                  {(['date', 'slot'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setBlockType(t)}
                      className={`py-2 rounded-xl border-2 text-xs font-body font-bold tracking-wide transition-all ${
                        blockType === t ? 'border-darkbrown bg-darkbrown text-cream' : 'border-sand/40 text-darkbrown/50 hover:border-sand'
                      }`}
                    >
                      {t === 'date' ? 'Full Day' : 'Specific Slot'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Date *</label>
                  <input type="date" required value={blockDate} onChange={e => setBlockDate(e.target.value)} className="input-field" />
                </div>
                {blockType === 'slot' && (
                  <div>
                    <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Time *</label>
                    <select required value={blockTime} onChange={e => setBlockTime(e.target.value)} className="input-field">
                      <option value="">Select a time…</option>
                      {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit" disabled={savingBlock} className="btn-primary w-full text-xs disabled:opacity-50">
                  {savingBlock ? 'Blocking…' : blockType === 'date' ? 'Block Full Day' : 'Block Time Slot'}
                </button>
              </form>
            </div>

            {/* Blocked days list */}
            {blocked.dates.length > 0 && (
              <div className="card">
                <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 font-bold mb-3">Blocked Days</p>
                <div className="space-y-2">
                  {[...blocked.dates].sort().map(d => (
                    <div key={d} className="flex items-center justify-between">
                      <span className="text-sm font-body text-darkbrown">{fmtDate(d)}</span>
                      <button onClick={() => handleUnblock('date', d)} className="text-xs font-body text-red-400 hover:text-red-600 font-bold uppercase tracking-wider">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <MiniCalendar
              markers={calMarkers}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {selectedDate && (
              <div className="card mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sub font-bold text-darkbrown">{fmtDate(selectedDate)}</p>
                  {isDayBlocked ? (
                    <button onClick={() => handleUnblock('date', selectedDate)} className="text-xs font-body font-bold text-red-400 hover:text-red-600 uppercase tracking-wider">Unblock Day</button>
                  ) : (
                    <button onClick={async () => {
                      await fetch('/api/admin/blocked', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'date', date: selectedDate }) })
                      await refreshBlocked()
                    }} className="text-xs font-body font-bold text-darkbrown/40 hover:text-red-500 uppercase tracking-wider">Block Whole Day</button>
                  )}
                </div>

                {isDayBlocked ? (
                  <p className="text-sm font-body text-red-500 bg-red-50 rounded-xl px-4 py-3">This entire day is blocked. Customers cannot book any slots.</p>
                ) : (
                  <div>
                    <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 mb-3">Time Slots</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map(slot => {
                        const isBlockedSlot = dayBlockedSlots.includes(slot.value)
                        const isBooked = dayAppointments.some(a => a.time === slot.value)
                        return (
                          <button
                            key={slot.value}
                            onClick={async () => {
                              if (isBlockedSlot) {
                                await handleUnblock('slot', selectedDate, slot.value)
                              } else if (!isBooked) {
                                setSavingBlock(true)
                                await fetch('/api/admin/blocked', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'slot', date: selectedDate, time: slot.value }) })
                                await refreshBlocked()
                                setSavingBlock(false)
                              }
                            }}
                            disabled={isBooked}
                            title={isBooked ? 'Already booked' : isBlockedSlot ? 'Click to unblock' : 'Click to block'}
                            className={`py-2 px-1 rounded-xl border-2 text-xs font-body font-bold tracking-wide transition-all
                              ${isBooked ? 'border-sand/20 bg-parchment text-darkbrown/30 cursor-not-allowed' :
                                isBlockedSlot ? 'border-red-400 bg-red-50 text-red-600' :
                                'border-sand/40 hover:border-red-300 hover:bg-red-50 text-darkbrown/70 cursor-pointer'
                              }`}
                          >
                            {slot.label}
                            {isBooked && <span className="block text-[9px] text-darkbrown/30 mt-0.5 font-normal">Booked</span>}
                            {isBlockedSlot && <span className="block text-[9px] text-red-400 mt-0.5 font-normal">Blocked</span>}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-3 text-xs font-body text-darkbrown/30 tracking-wide">Click an open slot to block it. Click a blocked slot to unblock.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ SERVICES TAB ════════════════ */}
      {tab === 'services' && (
        <div>
          <div className="flex justify-end mb-6">
            <button onClick={() => { setSvcForm(EMPTY_SVC); setEditingId(null); setShowSvcForm(!showSvcForm) }} className="btn-primary text-xs">
              {showSvcForm && !editingId ? 'Cancel' : '+ Add Service'}
            </button>
          </div>
          {showSvcForm && (
            <form onSubmit={handleSvcSave} className="card mb-8 space-y-4">
              <h2 className="font-display text-2xl text-darkbrown">{editingId ? 'Edit Service' : 'New Service'}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Service Name *</label>
                  <input type="text" required value={svcForm.name} onChange={e => setSvcForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g. Gel-X Full Set" />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Category *</label>
                  <select value={svcForm.category} onChange={e => setSvcForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Description *</label>
                <textarea required value={svcForm.description} onChange={e => setSvcForm(f => ({ ...f, description: e.target.value }))} className="input-field h-20 resize-none" placeholder="Brief description" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Price ($) *</label>
                  <input type="number" required min="0" step="0.01" value={svcForm.price} onChange={e => setSvcForm(f => ({ ...f, price: e.target.value }))} className="input-field" placeholder="45" />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Duration *</label>
                  <input type="text" required value={svcForm.duration} onChange={e => setSvcForm(f => ({ ...f, duration: e.target.value }))} className="input-field" placeholder="e.g. 60 min" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={savingSvc} className="btn-primary disabled:opacity-50">{savingSvc ? 'Saving…' : editingId ? 'Update' : 'Add Service'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setShowSvcForm(false); setSvcForm(EMPTY_SVC) }} className="btn-secondary">Cancel</button>}
              </div>
            </form>
          )}
          <div className="card p-0 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-darkbrown text-cream">
                  <tr>{['Service', 'Category', 'Duration', 'Price', ''].map(h => (
                    <th key={h} className="text-left px-6 py-4 font-body text-xs uppercase tracking-widest">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-sand/20">
                  {services.map(s => (
                    <tr key={s.id} className="hover:bg-terracotta-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-sub font-bold text-darkbrown">{s.name}</p>
                        <p className="text-darkbrown/40 text-xs mt-0.5 font-body">{s.description}</p>
                      </td>
                      <td className="px-6 py-4"><span className="text-xs font-body font-bold tracking-wider uppercase bg-teal-100 text-teal-700 px-3 py-1 rounded-full">{s.category}</span></td>
                      <td className="px-6 py-4 text-sm font-body text-sand">{s.duration}</td>
                      <td className="px-6 py-4"><span className="font-script text-xl text-terracotta-500">${s.price}</span></td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => handleSvcEdit(s)} className="text-xs font-body font-bold text-terracotta-500 hover:text-terracotta-700 uppercase tracking-wider">Edit</button>
                        <button onClick={() => handleSvcDelete(s.id)} className="text-xs font-body font-bold text-darkbrown/30 hover:text-red-500 uppercase tracking-wider">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-sand/20">
              {services.map(s => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-sub font-bold text-darkbrown">{s.name}</p>
                    <span className="font-script text-xl text-terracotta-500">${s.price}</span>
                  </div>
                  <span className="text-xs font-body font-bold tracking-wider uppercase bg-teal-100 text-teal-700 px-3 py-1 rounded-full">{s.category}</span>
                  <p className="text-darkbrown/40 text-xs mt-2 font-body">{s.description}</p>
                  <div className="flex gap-4 mt-3">
                    <button onClick={() => handleSvcEdit(s)} className="text-xs font-body font-bold text-terracotta-500 uppercase tracking-wider">Edit</button>
                    <button onClick={() => handleSvcDelete(s.id)} className="text-xs font-body font-bold text-darkbrown/30 uppercase tracking-wider">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MOBILE CHARGES TAB ════════════════ */}
      {tab === 'mobile' && (
        <div className="max-w-lg">
          <div className="mb-6">
            <p className="font-script text-teal-500 text-xl mb-0">on the go</p>
            <h2 className="font-display text-3xl text-darkbrown">Mobile Service Charges</h2>
            <p className="font-body text-sm text-darkbrown/40 mt-2 tracking-wide">
              These fees are added to the booking total when a customer selects mobile service. Changes take effect immediately.
            </p>
          </div>

          <form onSubmit={handleMobileSave} className="card space-y-4">
            {mobileEdits.map((area, i) => (
              <div key={area.id} className="flex items-center gap-4 p-4 rounded-2xl bg-parchment/60">
                <div className="flex-1">
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Area Name</label>
                  <input
                    type="text"
                    value={area.label}
                    onChange={e => setMobileEdits(prev => prev.map((a, idx) => idx === i ? { ...a, label: e.target.value } : a))}
                    className="input-field"
                  />
                </div>
                <div className="w-28">
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={area.fee}
                    onChange={e => setMobileEdits(prev => prev.map((a, idx) => idx === i ? { ...a, fee: Number(e.target.value) } : a))}
                    className="input-field"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={savingMobile} className="btn-primary disabled:opacity-50">
                {savingMobile ? 'Saving…' : 'Save Changes'}
              </button>
              {mobileSaved && <span className="text-xs font-body text-forest-600 font-bold tracking-wide">✓ Saved!</span>}
            </div>
          </form>

          <div className="card mt-6">
            <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 font-bold mb-3">Current Rates</p>
            <ul className="space-y-2">
              {mobileAreas.map(area => (
                <li key={area.id} className="flex justify-between items-center text-sm font-body">
                  <span className="text-darkbrown">{area.label}</span>
                  <span className="font-script text-xl text-terracotta-500">+${area.fee}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
