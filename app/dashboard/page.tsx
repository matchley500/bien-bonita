'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Appointment {
  id: string
  date: string
  time: string
  customerName: string
  serviceNames: string
  total: number
  notes: string
  locationType?: string
  mobileArea?: string
  status?: string
  finalPrice?: number
  rescheduleRequest?: {
    requestedDate: string
    requestedTime: string
    note: string
  }
}

const SLOT_LABELS: Record<string, string> = {
  '09:30': '9:30 AM', '12:00': '12:00 PM', '14:30': '2:30 PM',
}
function fmtTime(val: string) {
  if (SLOT_LABELS[val]) return SLOT_LABELS[val]
  const [h, m] = val.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return val
  const period = h < 12 ? 'AM' : 'PM'
  const dh = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${dh}:${String(m).padStart(2, '0')} ${period}`
}
function fmtDate(d: string) {
  if (!d) return ''
  const [y, mo, day] = d.split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}
function isPast(dateStr: string) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d) < new Date(new Date().setHours(0, 0, 0, 0))
}

function statusBadge(appt: Appointment) {
  if (appt.status === 'pending_approval') {
    return <span className="inline-block px-2.5 py-0.5 rounded-full bg-mustard-100 text-mustard-700 font-body text-[10px] font-bold uppercase tracking-widest">Pending Approval</span>
  }
  if (appt.status === 'done') {
    return <span className="inline-block px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-700 font-body text-[10px] font-bold uppercase tracking-widest">Completed</span>
  }
  if (isPast(appt.date)) {
    return <span className="inline-block px-2.5 py-0.5 rounded-full bg-sand/40 text-darkbrown/40 font-body text-[10px] font-bold uppercase tracking-widest">Past</span>
  }
  return <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-body text-[10px] font-bold uppercase tracking-widest">Confirmed</span>
}

export default function DashboardPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/customer/me')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setName(data.name)
        setAppointments(data.appointments ?? [])
        setLoading(false)
      })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/customer/logout', { method: 'POST' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-body tracking-widest uppercase text-sm text-darkbrown/40">Loading…</p>
      </div>
    )
  }

  const upcoming = appointments.filter(a => !isPast(a.date) && a.status !== 'done')
  const past = appointments.filter(a => isPast(a.date) || a.status === 'done')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <p className="font-script text-teal-500 text-2xl mb-0">hello!</p>
          <h1 className="font-display text-4xl text-darkbrown">{name}</h1>
          <div className="h-0.5 w-10 bg-mustard-400 mt-2 rounded-full" />
        </div>
        <button onClick={handleLogout} className="btn-secondary text-xs mt-2">Log Out</button>
      </div>

      {/* Upcoming appointments */}
      <div className="mb-10">
        <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 font-bold mb-4">Upcoming Appointments</p>
        {upcoming.length === 0 ? (
          <div className="card text-center py-10">
            <p className="font-body text-darkbrown/40 text-sm tracking-wide">No upcoming appointments.</p>
            <p className="font-body text-xs text-darkbrown/30 mt-1 tracking-wide">
              Contact us at bienbonitanailandspa@gmail.com to book.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(appt => (
              <div key={appt.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {statusBadge(appt)}
                    </div>
                    <p className="font-display text-xl text-darkbrown">{fmtDate(appt.date)}</p>
                    <p className="font-body text-sm text-terracotta-500 font-bold mt-0.5">⏰ {fmtTime(appt.time)}</p>
                  </div>
                  {appt.total > 0 && (
                    <span className="font-script text-2xl text-terracotta-500 shrink-0">${appt.total}</span>
                  )}
                </div>
                {appt.serviceNames && (
                  <p className="font-body text-sm text-teal-600">✨ {appt.serviceNames}</p>
                )}
                {appt.locationType === 'mobile' && appt.mobileArea && (
                  <p className="font-body text-xs text-mustard-600">🚗 Mobile service · {appt.mobileArea}</p>
                )}
                {appt.notes && (
                  <p className="font-body text-xs text-darkbrown/40 italic">{appt.notes}</p>
                )}
                {/* Reschedule request pending */}
                {appt.rescheduleRequest && (
                  <div className="bg-mustard-50 border border-mustard-200 rounded-xl px-4 py-3 text-xs font-body text-mustard-700">
                    🔄 Reschedule request pending for {fmtDate(appt.rescheduleRequest.requestedDate)} at {fmtTime(appt.rescheduleRequest.requestedTime)}
                  </div>
                )}
                {/* Can request reschedule if confirmed (not pending) */}
                {appt.status !== 'pending_approval' && !appt.rescheduleRequest && !isPast(appt.date) && (
                  <Link
                    href={`/reschedule?email=${encodeURIComponent(appt.customerName)}&date=${appt.date}`}
                    className="inline-block font-body text-xs font-bold uppercase tracking-wider text-darkbrown/40 hover:text-terracotta-500 transition-colors"
                  >
                    Request Reschedule →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past appointments */}
      {past.length > 0 && (
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-darkbrown/40 font-bold mb-4">Past Appointments</p>
          <div className="card p-0 overflow-hidden divide-y divide-sand/20">
            {past.map(appt => (
              <div key={appt.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-sub font-bold text-darkbrown text-sm">{fmtDate(appt.date)}</p>
                  <p className="font-body text-xs text-darkbrown/40 mt-0.5">
                    {fmtTime(appt.time)}{appt.serviceNames ? ` · ${appt.serviceNames}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {appt.status === 'done' && appt.finalPrice !== undefined ? (
                    <span className="font-script text-xl text-forest-600">${appt.finalPrice}</span>
                  ) : appt.total > 0 ? (
                    <span className="font-script text-xl text-darkbrown/40">${appt.total}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
