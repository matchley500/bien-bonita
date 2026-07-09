'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────
interface Service {
  id: string; name: string; description: string
  price: number; duration: string; category: string
}
interface RescheduleRequest {
  requestedDate: string
  requestedTime: string
  note: string
  createdAt: string
}
interface Appointment {
  id: string; date: string; time: string
  customerName: string; customerEmail: string; customerPhone: string
  serviceNames: string; total: number; notes: string
  locationType?: string; mobileArea?: string; mobileFee?: number
  address?: string
  createdAt: string
  status?: 'pending_approval' | 'confirmed' | 'done' | 'rejected'
  finalPrice?: number
  rescheduleRequest?: RescheduleRequest
}
interface MobileArea { id: string; label: string; fee: number; travelMinutes?: number }
interface CustomerAccount { id: string; email: string; name: string; createdAt: string; status?: 'pending' | 'active' }
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
type EditForm = { date: string; time: string; customerName: string; customerEmail: string; customerPhone: string; serviceNames: string; total: string; notes: string }

// Fixed 3-slot system (Tue-Thu, 9:30 AM / 12:00 PM / 2:30 PM)
const TIME_SLOTS = [
  { value: '09:30', label: '9:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:30', label: '2:30 PM' },
]
function fmtTime(val: string) {
  const found = TIME_SLOTS.find(s => s.value === val)
  if (found) return found.label
  const [h, m] = val.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return val
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${period}`
}
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
  const [tab, setTab] = useState<'appointments' | 'availability' | 'services' | 'mobile' | 'accounting' | 'clients' | 'settings'>('appointments')
  const [services, setServices] = useState<Service[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [mobileAreas, setMobileAreas] = useState<MobileArea[]>([])
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
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

  // All Done modal
  const [doneModal, setDoneModal] = useState<{ id: string; originalTotal: number } | null>(null)
  const [donePrice, setDonePrice] = useState('')

  // Edit appointment modal
  const [editModal, setEditModal] = useState<Appointment | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_APPT)
  const [savingEdit, setSavingEdit] = useState(false)

  // Settings
  const [bookingOpen, setBookingOpen] = useState(false)
  const [salonAddress, setSalonAddress] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Test reminder email
  const [testEmailState, setTestEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Per-client password reset feedback
  const [resetStates, setResetStates] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  // Service form ref for scroll-to
  const svcFormRef = useRef<HTMLFormElement>(null)

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
        fetch('/api/admin/settings').then(r => r.json()),
        fetch('/api/admin/customers').then(r => r.json()),
      ]).then(([svcs, apts, mob, blk, settings, custs]) => {
        setServices(svcs)
        setAppointments(apts)
        const areas = mob.areas || []
        setMobileAreas(areas)
        setMobileEdits(areas.map((a: MobileArea) => ({ ...a })))
        setBlocked(blk)
        setBookingOpen(settings.bookingOpen ?? false)
        setSalonAddress(settings.salonAddress ?? '')
        setCustomers(Array.isArray(custs) ? custs : [])
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
    setTimeout(() => svcFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
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

  const handleAllDone = async () => {
    if (!doneModal) return
    await fetch(`/api/admin/appointments/${doneModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', finalPrice: Number(donePrice) || doneModal.originalTotal }),
    })
    setDoneModal(null)
    await refreshAppointments()
  }

  // ── Edit appointment ──
  const handleApptEditOpen = (appt: Appointment) => {
    setEditModal(appt)
    setEditForm({
      date: appt.date,
      time: appt.time,
      customerName: appt.customerName,
      customerEmail: appt.customerEmail,
      customerPhone: appt.customerPhone,
      serviceNames: appt.serviceNames,
      total: String(appt.total),
      notes: appt.notes,
    })
  }
  const handleApptEditSave = async () => {
    if (!editModal) return
    setSavingEdit(true)
    await fetch(`/api/admin/appointments/${editModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: editForm.date,
        time: editForm.time,
        customerName: editForm.customerName,
        customerEmail: editForm.customerEmail,
        customerPhone: editForm.customerPhone,
        serviceNames: editForm.serviceNames,
        total: Number(editForm.total) || 0,
        notes: editForm.notes,
        rescheduleRequest: null, // clear any pending request
      }),
    })
    setEditModal(null)
    setSavingEdit(false)
    await refreshAppointments()
  }
  const applyReschedule = (req: RescheduleRequest) => {
    setEditForm(f => ({ ...f, date: req.requestedDate, time: req.requestedTime }))
  }
  const dismissReschedule = async (apptId: string) => {
    await fetch(`/api/admin/appointments/${apptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rescheduleRequest: null }),
    })
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

  // ── Approve / Reject appointment ──
  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    await refreshAppointments()
  }
  const handleReject = async (id: string) => {
    if (!confirm('Reject this booking request? A rejection email will be sent to the customer.')) return
    await fetch(`/api/admin/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    await refreshAppointments()
  }

  // ── Approve / Deny account requests ──
  const refreshCustomers = async () => {
    const custs = await fetch('/api/admin/customers').then(r => r.json())
    setCustomers(Array.isArray(custs) ? custs : [])
  }
  const handleApproveAccount = async (id: string) => {
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    await refreshCustomers()
  }
  const handleDenyAccount = async (id: string) => {
    if (!confirm('Deny this account request? The account will be removed (no email is sent).')) return
    await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    await refreshCustomers()
  }

  // ── Client management ──
  const handleResetPassword = async (id: string) => {
    if (!confirm('Reset this client\'s password? A new temporary password will be emailed to them.')) return
    setResetStates(s => ({ ...s, [id]: 'sending' }))
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (!data.emailed && data.tempPassword) {
        alert(`The email could not be sent. Temporary password: ${data.tempPassword}\nShare it with the client directly.`)
      }
      setResetStates(s => ({ ...s, [id]: 'sent' }))
    } catch {
      setResetStates(s => ({ ...s, [id]: 'error' }))
    }
    setTimeout(() => setResetStates(s => { const { [id]: _drop, ...rest } = s; return rest }), 4000)
  }
  const handleRemoveAccount = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}'s account? They will no longer be able to log in. Their appointments are not affected.`)) return
    await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    await refreshCustomers()
  }

  // ── Settings ──
  const handleSettingsSave = async () => {
    setSavingSettings(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingOpen, salonAddress }),
    })
    setSavingSettings(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2500)
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
  const apptDateSet = new Set(appointments.filter(a => a.status !== 'rejected').map(a => a.date))
  const blockedDateSet = new Set(blocked.dates)
  const calMarkers: Record<string, 'appt' | 'blocked' | 'both'> = {}
  apptDateSet.forEach(d => { calMarkers[d] = blockedDateSet.has(d) ? 'both' : 'appt' })
  blockedDateSet.forEach(d => { if (!calMarkers[d]) calMarkers[d] = 'blocked' })

  const dayAppointments = selectedDate
    ? appointments.filter(a => a.date === selectedDate && a.status !== 'rejected').sort((a, b) => a.time.localeCompare(b.time))
    : []
  const dayBlockedSlots = selectedDate
    ? blocked.slots.filter(s => s.date === selectedDate).map(s => s.time)
    : []
  const isDayBlocked = blocked.dates.includes(selectedDate)

  if (authenticated === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="font-body tracking-widest uppercase text-sm text-darkbrown/40">Loading…</p></div>
  }

  const pendingAppts = appointments.filter(a => a.status === 'pending_approval')
  const activeAppts = appointments.filter(a => a.status !== 'rejected' && a.status !== 'pending_approval')
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const upcomingAppts = appointments.filter(a => a.status !== 'rejected' && a.date >= todayStr)
  const upcomingActiveCount = activeAppts.filter(a => a.date >= todayStr).length
  const pendingAccounts = customers.filter(c => c.status === 'pending')
  const doneAppointments = appointments.filter(a => a.status === 'done')
  const accountingTotal = doneAppointments.reduce((sum, a) => sum + (a.finalPrice ?? a.total), 0)

  const tabConfig = [
    { key: 'appointments', label: `Appointments${upcomingActiveCount ? ` (${upcomingActiveCount})` : ''}${pendingAppts.length + pendingAccounts.length ? ` · ${pendingAppts.length + pendingAccounts.length} pending` : ''}` },
    { key: 'availability', label: 'Availability' },
    { key: 'services', label: 'Services' },
    { key: 'mobile', label: 'Mobile Charges' },
    { key: 'accounting', label: `Accounting${doneAppointments.length ? ` (${doneAppointments.length})` : ''}` },
    { key: 'clients', label: `Clients${customers.length ? ` (${customers.length})` : ''}${pendingAccounts.length ? ` · ${pendingAccounts.length} pending` : ''}` },
    { key: 'settings', label: 'Settings' },
  ] as const

  const handleTestEmail = async () => {
    setTestEmailState('sending')
    try {
      const res = await fetch('/api/admin/test-reminder', { method: 'POST' })
      setTestEmailState(res.ok ? 'sent' : 'error')
    } catch {
      setTestEmailState('error')
    }
    setTimeout(() => setTestEmailState('idle'), 4000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-script text-teal-500 text-xl">admin</p>
          <h1 className="font-display text-4xl text-darkbrown">Dashboard</h1>
          <div className="h-0.5 w-10 bg-mustard-400 mt-2 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestEmail}
            disabled={testEmailState === 'sending'}
            className="text-xs font-body font-bold uppercase tracking-widest text-darkbrown/40 hover:text-teal-600 transition-colors disabled:opacity-40"
            title="Sends a sample reminder email to the admin Gmail to preview how it looks"
          >
            {testEmailState === 'sending' ? 'Sending…' : testEmailState === 'sent' ? '✓ Email Sent!' : testEmailState === 'error' ? '✗ Failed' : '✉ Test Reminder Email'}
          </button>
          <button onClick={handleLogout} className="btn-secondary text-xs">Logout</button>
        </div>
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
        <>
        {/* Pending account requests */}
        {pendingAccounts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 font-body text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse" />
                {pendingAccounts.length} Account Request{pendingAccounts.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {pendingAccounts.map(acct => (
                <div key={acct.id} className="card border-teal-200 bg-teal-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-sub font-bold text-darkbrown text-base">{acct.name}</p>
                      <p className="font-body text-xs text-darkbrown/50 mt-0.5">✉ {acct.email}</p>
                      <p className="font-body text-[11px] text-darkbrown/40 mt-0.5">
                        Requested {new Date(acct.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveAccount(acct.id)}
                        className="text-xs font-body font-bold text-forest-600 hover:text-forest-800 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 border border-forest-300"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDenyAccount(acct.id)}
                        className="text-xs font-body font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                      >
                        ✕ Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-sand/40 mt-8 mb-0" />
          </div>
        )}
        {/* Pending approval section */}
        {pendingAppts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 bg-mustard-100 text-mustard-700 font-body text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-mustard-500 inline-block animate-pulse" />
                {pendingAppts.length} Pending Approval
              </span>
            </div>
            <div className="space-y-3">
              {pendingAppts.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(appt => (
                <div key={appt.id} className="card border-mustard-200 bg-mustard-50/40">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="rounded-2xl px-4 py-3 text-center min-w-[90px] bg-mustard-100 border border-mustard-300">
                      <p className="font-display text-xl text-mustard-700 leading-tight">{fmtTime(appt.time)}</p>
                      <p className="text-[9px] font-body font-bold uppercase tracking-widest text-mustard-500 mt-0.5">Pending</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sub font-bold text-darkbrown text-base">{appt.customerName}</p>
                      <p className="font-body text-xs text-darkbrown/50 mt-0.5">{fmtDate(appt.date)}</p>
                      {appt.serviceNames && <p className="text-xs font-body text-teal-600 mt-0.5">{appt.serviceNames}</p>}
                      {appt.locationType === 'mobile' && appt.mobileArea && (
                        <p className="text-xs font-body text-mustard-600 mt-0.5">🚗 Mobile — {appt.mobileArea}{appt.mobileFee ? ` (+$${appt.mobileFee})` : ''}</p>
                      )}
                      {appt.locationType === 'mobile' && appt.address && (
                        <p className="text-xs font-body text-darkbrown/60 mt-0.5">📍 {appt.address}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-body text-darkbrown/50">
                        {appt.customerPhone && <span>📞 {appt.customerPhone}</span>}
                        {appt.customerEmail && <span>✉ {appt.customerEmail}</span>}
                      </div>
                      {appt.notes && <p className="mt-1 text-xs font-body text-darkbrown/40 italic">{appt.notes}</p>}
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      {appt.total > 0 && <p className="font-script text-xl text-terracotta-500 text-center">${appt.total}</p>}
                      <button
                        onClick={() => handleApprove(appt.id)}
                        className="text-xs font-body font-bold text-forest-600 hover:text-forest-800 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 border border-forest-300"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(appt.id)}
                        className="text-xs font-body font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-sand/40 mt-8 mb-0" />
          </div>
        )}
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
                      <div key={appt.id} className={`card flex flex-col gap-3 ${appt.status === 'done' ? 'opacity-60 bg-parchment/40' : ''}`}>
                        {/* Reschedule request banner */}
                        {appt.rescheduleRequest && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-mustard-50 border border-mustard-300 rounded-2xl px-4 py-3">
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="text-mustard-500 text-base mt-0.5">🔄</span>
                              <div className="min-w-0">
                                <p className="font-body text-xs font-bold uppercase tracking-widest text-mustard-700">Reschedule Request</p>
                                <p className="font-body text-sm text-darkbrown mt-0.5">
                                  {fmtDate(appt.rescheduleRequest.requestedDate)} at {fmtTime(appt.rescheduleRequest.requestedTime)}
                                </p>
                                {appt.rescheduleRequest.note && (
                                  <p className="text-xs font-body text-darkbrown/50 italic mt-0.5">&ldquo;{appt.rescheduleRequest.note}&rdquo;</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => { handleApptEditOpen(appt); setTimeout(() => applyReschedule(appt.rescheduleRequest!), 0) }}
                                className="text-xs font-body font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-mustard-400 text-darkbrown hover:bg-mustard-500 transition-colors"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => dismissReschedule(appt.id)}
                                className="text-xs font-body font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl text-darkbrown/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className={`rounded-2xl px-4 py-3 text-center min-w-[90px] ${appt.status === 'done' ? 'bg-forest-50 border border-forest-200' : 'bg-terracotta-50 border border-terracotta-200'}`}>
                            <p className={`font-display text-xl leading-tight ${appt.status === 'done' ? 'text-forest-600' : 'text-terracotta-500'}`}>{fmtTime(appt.time)}</p>
                            {appt.status === 'done' && <p className="text-[9px] font-body font-bold uppercase tracking-widest text-forest-500 mt-0.5">Done</p>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-sub font-bold text-darkbrown text-base">{appt.customerName}</p>
                                {appt.serviceNames && <p className="text-xs font-body text-teal-600 mt-0.5">{appt.serviceNames}</p>}
                                {appt.locationType === 'mobile' && appt.mobileArea && (
                                  <p className="text-xs font-body text-mustard-600 mt-0.5">🚗 Mobile — {appt.mobileArea}{appt.mobileFee ? ` (+$${appt.mobileFee})` : ''}</p>
                                )}
                                {appt.locationType === 'mobile' && appt.address && (
                                  <p className="text-xs font-body text-darkbrown/60 mt-0.5">📍 {appt.address}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                {appt.status === 'done' && appt.finalPrice !== undefined ? (
                                  <div>
                                    <span className="font-script text-xl text-forest-600">${appt.finalPrice}</span>
                                    {appt.finalPrice !== appt.total && <p className="text-[10px] font-body text-darkbrown/30 line-through">${appt.total}</p>}
                                  </div>
                                ) : appt.total > 0 ? (
                                  <span className="font-script text-xl text-terracotta-500">${appt.total}</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-body text-darkbrown/50">
                              {appt.customerPhone && <span>📞 {appt.customerPhone}</span>}
                              {appt.customerEmail && <span>✉ {appt.customerEmail}</span>}
                            </div>
                            {appt.notes && <p className="mt-2 text-xs font-body text-darkbrown/40 italic">{appt.notes}</p>}
                          </div>
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            {appt.status !== 'done' && (
                              <button
                                onClick={() => { setDoneModal({ id: appt.id, originalTotal: appt.total }); setDonePrice(String(appt.total)) }}
                                className="text-xs font-body font-bold text-forest-600 hover:text-forest-800 uppercase tracking-wider transition-colors px-3 py-1 rounded-lg hover:bg-forest-50 border border-forest-300"
                              >
                                All Done
                              </button>
                            )}
                            <button
                              onClick={() => handleApptEditOpen(appt)}
                              className="text-xs font-body font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider transition-colors px-3 py-1 rounded-lg hover:bg-teal-50 border border-teal-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleApptDelete(appt.id)}
                              className="text-xs font-body font-bold text-darkbrown/25 hover:text-red-500 uppercase tracking-wider transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
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
                {upcomingAppts.length > 0 && (
                  <div className="mt-8 text-left max-h-96 overflow-y-auto space-y-1">
                    <p className="font-body text-xs uppercase tracking-widest text-darkbrown/30 mb-3">All Upcoming</p>
                    {[...upcomingAppts]
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
        </>
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
            <form ref={svcFormRef} onSubmit={handleSvcSave} className="card mb-8 space-y-4">
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
              <div key={area.id} className="p-4 rounded-2xl bg-parchment/60 space-y-3">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Area Name</label>
                  <input
                    type="text"
                    value={area.label}
                    onChange={e => setMobileEdits(prev => prev.map((a, idx) => idx === i ? { ...a, label: e.target.value } : a))}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                <div>
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
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Travel (min, one-way)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={area.travelMinutes ?? 15}
                    onChange={e => setMobileEdits(prev => prev.map((a, idx) => idx === i ? { ...a, travelMinutes: Number(e.target.value) } : a))}
                    className="input-field"
                  />
                </div>
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

      {/* ════════════════ ACCOUNTING TAB ════════════════ */}
      {tab === 'accounting' && (
        <div>
          <div className="mb-6">
            <p className="font-script text-teal-500 text-xl mb-0">by the numbers</p>
            <h2 className="font-display text-3xl text-darkbrown">Accounting</h2>
            <p className="font-body text-sm text-darkbrown/40 mt-2 tracking-wide">
              Completed appointments with confirmed final charges.
            </p>
          </div>

          {doneAppointments.length === 0 ? (
            <div className="card text-center py-16">
              <p className="font-body text-darkbrown/40 text-sm tracking-wide">No completed appointments yet.</p>
              <p className="font-body text-darkbrown/30 text-xs mt-2 tracking-wide">Mark appointments as &ldquo;All Done&rdquo; to see them here.</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="card text-center">
                  <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 mb-1">Completed</p>
                  <p className="font-display text-3xl text-darkbrown">{doneAppointments.length}</p>
                </div>
                <div className="card text-center">
                  <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 mb-1">Est. Total</p>
                  <p className="font-script text-3xl text-darkbrown/40">${doneAppointments.reduce((s, a) => s + a.total, 0)}</p>
                </div>
                <div className="card text-center border-forest-200 bg-forest-50/30">
                  <p className="font-body text-xs uppercase tracking-widest text-forest-600/60 mb-1">Charged Total</p>
                  <p className="font-script text-3xl text-forest-600">${accountingTotal}</p>
                </div>
              </div>

              {/* Table */}
              <div className="card p-0 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-darkbrown text-cream">
                      <tr>{['Date', 'Client', 'Services', 'Est.', 'Charged', 'Tip'].map(h => (
                        <th key={h} className="text-left px-5 py-4 font-body text-xs uppercase tracking-widest">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-sand/20">
                      {[...doneAppointments].sort((a, b) => b.date.localeCompare(a.date)).map(appt => {
                        const charged = appt.finalPrice ?? appt.total
                        const tip = charged - appt.total
                        return (
                          <tr key={appt.id} className="hover:bg-forest-50/20 transition-colors">
                            <td className="px-5 py-4 text-sm font-body text-darkbrown/60 whitespace-nowrap">{fmtDate(appt.date)}<br /><span className="text-xs text-darkbrown/40">{fmtTime(appt.time)}</span></td>
                            <td className="px-5 py-4">
                              <p className="font-sub font-bold text-darkbrown text-sm">{appt.customerName}</p>
                              {appt.customerPhone && <p className="text-xs font-body text-darkbrown/40">{appt.customerPhone}</p>}
                            </td>
                            <td className="px-5 py-4 text-xs font-body text-teal-600 max-w-[180px]">{appt.serviceNames || '—'}</td>
                            <td className="px-5 py-4"><span className="font-body text-sm text-darkbrown/40">${appt.total}</span></td>
                            <td className="px-5 py-4"><span className="font-script text-xl text-forest-600">${charged}</span></td>
                            <td className="px-5 py-4"><span className={`font-body text-sm font-bold ${tip > 0 ? 'text-mustard-600' : 'text-darkbrown/30'}`}>{tip > 0 ? `+$${tip}` : '—'}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-parchment">
                      <tr>
                        <td colSpan={4} className="px-5 py-4 font-body text-xs uppercase tracking-widest text-darkbrown/40 text-right">Total Charged</td>
                        <td className="px-5 py-4"><span className="font-script text-2xl text-forest-600">${accountingTotal}</span></td>
                        <td className="px-5 py-4">
                          <span className="font-body text-sm font-bold text-mustard-600">
                            {(() => { const t = doneAppointments.reduce((s, a) => s + ((a.finalPrice ?? a.total) - a.total), 0); return t > 0 ? `+$${t}` : '—' })()}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Mobile list */}
                <div className="md:hidden divide-y divide-sand/20">
                  {[...doneAppointments].sort((a, b) => b.date.localeCompare(a.date)).map(appt => {
                    const charged = appt.finalPrice ?? appt.total
                    const tip = charged - appt.total
                    return (
                      <div key={appt.id} className="p-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-sub font-bold text-darkbrown">{appt.customerName}</p>
                            <p className="text-xs font-body text-darkbrown/40">{fmtDate(appt.date)} · {fmtTime(appt.time)}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-script text-xl text-forest-600">${charged}</span>
                            {tip > 0 && <p className="text-xs font-body font-bold text-mustard-600">+${tip} tip</p>}
                          </div>
                        </div>
                        {appt.serviceNames && <p className="text-xs font-body text-teal-600 mt-1">{appt.serviceNames}</p>}
                      </div>
                    )
                  })}
                  <div className="p-4 bg-parchment flex justify-between items-center">
                    <span className="font-body text-xs uppercase tracking-widest text-darkbrown/40">Total Charged</span>
                    <span className="font-script text-2xl text-forest-600">${accountingTotal}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════ CLIENTS TAB ════════════════ */}
      {tab === 'clients' && (
        <div className="max-w-3xl">
          <div className="mb-6">
            <h2 className="font-display text-2xl text-darkbrown">Client Accounts</h2>
            <p className="font-body text-xs text-darkbrown/40 tracking-wide mt-1">
              Approve requests, reset passwords, or remove portal accounts. Removing an account does not affect appointments.
            </p>
          </div>

          {customers.length === 0 ? (
            <div className="card text-center py-12">
              <p className="font-body text-darkbrown/40 text-sm tracking-wide">No client accounts yet.</p>
              <p className="font-body text-xs text-darkbrown/30 mt-1 tracking-wide">Accounts appear here when clients sign up on the portal.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden divide-y divide-sand/20">
              {[...customers]
                .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || a.name.localeCompare(b.name))
                .map(acct => (
                <div key={acct.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-sub font-bold text-darkbrown text-sm">{acct.name}</p>
                      {acct.status === 'pending' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-mustard-100 text-mustard-700 font-body text-[9px] font-bold uppercase tracking-widest">Pending</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-body text-[9px] font-bold uppercase tracking-widest">Active</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-darkbrown/50 mt-0.5">✉ {acct.email}</p>
                    <p className="font-body text-[11px] text-darkbrown/30 mt-0.5">
                      Joined {new Date(acct.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {acct.status === 'pending' && (
                      <button
                        onClick={() => handleApproveAccount(acct.id)}
                        className="text-xs font-body font-bold text-forest-600 hover:text-forest-800 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 border border-forest-300"
                      >
                        ✓ Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(acct.id)}
                      disabled={resetStates[acct.id] === 'sending'}
                      className="text-xs font-body font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 disabled:opacity-50"
                    >
                      {resetStates[acct.id] === 'sending' ? 'Resetting…'
                        : resetStates[acct.id] === 'sent' ? '✓ Emailed'
                        : resetStates[acct.id] === 'error' ? '✗ Failed'
                        : '🔑 Reset Password'}
                    </button>
                    <button
                      onClick={() => handleRemoveAccount(acct.id, acct.name)}
                      className="text-xs font-body font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ SETTINGS TAB ════════════════ */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-8">
          <div>
            <p className="font-script text-teal-500 text-xl mb-0">manage</p>
            <h2 className="font-display text-3xl text-darkbrown">Settings</h2>
          </div>

          {/* Booking open/closed */}
          <div className="card space-y-4">
            <div>
              <p className="font-sub font-bold text-darkbrown text-lg">Online Booking</p>
              <p className="font-body text-sm text-darkbrown/40 mt-1 tracking-wide">
                When closed, new customers cannot submit booking requests online. The &ldquo;closed for new clients&rdquo; bubble will appear on the site.
              </p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-parchment/60">
              <div>
                <p className="font-body text-sm font-bold text-darkbrown uppercase tracking-widest">
                  {bookingOpen ? 'Open for Bookings' : 'Closed for New Clients'}
                </p>
                <p className="font-body text-xs text-darkbrown/40 mt-0.5">
                  {bookingOpen ? 'Customers can submit booking requests.' : 'Booking requests are currently blocked.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingOpen(v => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${bookingOpen ? 'bg-forest-500' : 'bg-darkbrown/20'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${bookingOpen ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Salon Address</label>
              <input
                type="text"
                value={salonAddress}
                onChange={e => setSalonAddress(e.target.value)}
                className="input-field"
                placeholder="123 Main St, Tucson, AZ 85701"
              />
              <p className="font-body text-[11px] text-darkbrown/30 mt-1">
                Sent to clients in their confirmation email and calendar invite for in-salon appointments.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleSettingsSave} disabled={savingSettings} className="btn-primary disabled:opacity-50">
                {savingSettings ? 'Saving…' : 'Save Settings'}
              </button>
              {settingsSaved && <span className="text-xs font-body text-forest-600 font-bold tracking-wide">✓ Saved!</span>}
            </div>
          </div>

          {/* Schedule info */}
          <div className="card space-y-3">
            <p className="font-sub font-bold text-darkbrown text-lg">Booking Schedule</p>
            <div className="space-y-2 font-body text-sm text-darkbrown/60">
              <p>📅 <strong>Days:</strong> Tuesday, Wednesday, Thursday</p>
              <p>⏰ <strong>Slots:</strong> 9:30 AM · 12:00 PM · 2:30 PM</p>
              <p>👥 <strong>Max clients per day:</strong> 3</p>
              <p>🕐 <strong>Appointment duration:</strong> 2 hours + 30 min grace</p>
              <p>🚗 <strong>Mobile travel:</strong> Added per area (configure in Mobile Charges tab)</p>
            </div>
            <p className="font-body text-xs text-darkbrown/30 tracking-wide">
              These settings are built into the scheduling system. Contact your developer to change them.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════ ALL DONE MODAL ════════════════ */}
      {doneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkbrown/40 backdrop-blur-sm">
          <div className="bg-cream rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-5">
            <div>
              <p className="font-script text-teal-500 text-2xl mb-0">all done!</p>
              <h2 className="font-display text-2xl text-darkbrown">Confirm Final Charge</h2>
              <p className="font-body text-sm text-darkbrown/50 mt-1 tracking-wide">
                Enter the total amount collected. Adjust for tips or any services added during the appointment.
              </p>
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-2">Final Amount Charged ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={donePrice}
                onChange={e => setDonePrice(e.target.value)}
                className="input-field text-2xl font-script text-center"
              />
              {doneModal.originalTotal > 0 && (
                <p className="text-xs font-body text-darkbrown/40 mt-1 text-center">
                  Original estimate: ${doneModal.originalTotal}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDoneModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAllDone} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ EDIT APPOINTMENT MODAL ════════════════ */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkbrown/40 backdrop-blur-sm">
          <div className="bg-cream rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-script text-teal-500 text-2xl mb-0">editing</p>
                  <h2 className="font-display text-2xl text-darkbrown">{editModal.customerName}</h2>
                </div>
                <button onClick={() => setEditModal(null)} className="text-darkbrown/30 hover:text-darkbrown text-2xl leading-none mt-1">✕</button>
              </div>

              {/* Reschedule request notice inside edit modal */}
              {editModal.rescheduleRequest && (
                <div className="bg-mustard-50 border border-mustard-300 rounded-2xl p-4 space-y-2">
                  <p className="font-body text-xs font-bold uppercase tracking-widest text-mustard-700">🔄 Pending Reschedule Request</p>
                  <p className="font-body text-sm text-darkbrown">
                    Customer requested: <strong>{fmtDate(editModal.rescheduleRequest.requestedDate)}</strong> at <strong>{fmtTime(editModal.rescheduleRequest.requestedTime)}</strong>
                  </p>
                  {editModal.rescheduleRequest.note && (
                    <p className="text-xs font-body text-darkbrown/50 italic">&ldquo;{editModal.rescheduleRequest.note}&rdquo;</p>
                  )}
                  <button
                    type="button"
                    onClick={() => applyReschedule(editModal.rescheduleRequest!)}
                    className="text-xs font-body font-bold uppercase tracking-wider px-4 py-2 rounded-xl bg-mustard-400 text-darkbrown hover:bg-mustard-500 transition-colors"
                  >
                    Apply to Form
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Date *</label>
                  <input
                    type="date" required
                    value={editForm.date}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Time *</label>
                  <select
                    required
                    value={editForm.time}
                    onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select…</option>
                    {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Client Name *</label>
                <input
                  type="text" required
                  value={editForm.customerName}
                  onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.customerEmail}
                    onChange={e => setEditForm(f => ({ ...f, customerEmail: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.customerPhone}
                    onChange={e => setEditForm(f => ({ ...f, customerPhone: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Services</label>
                <input
                  type="text"
                  value={editForm.serviceNames}
                  onChange={e => setEditForm(f => ({ ...f, serviceNames: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Spa Manicure, Gel Polish"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Total ($)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editForm.total}
                    onChange={e => setEditForm(f => ({ ...f, total: e.target.value }))}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Notes</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    className="input-field"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={handleApptEditSave}
                  disabled={savingEdit || !editForm.date || !editForm.time || !editForm.customerName}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
