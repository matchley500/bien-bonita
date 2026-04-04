'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  category: string
}

const categories = [
  { value: 'manicure',   label: 'Manicures' },
  { value: 'pedicure',   label: 'Pedicures' },
  { value: 'gel',        label: 'Gel Polish' },
  { value: 'extensions', label: 'Extensions' },
  { value: 'removals',   label: 'Removals' },
  { value: 'designs',    label: 'Designs' },
  { value: 'addons',     label: 'Add-Ons' },
]

const emptyForm = { name: '', description: '', price: '', duration: '', category: 'manicure' }

export default function AdminDashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/check').then(res => {
      if (!res.ok) { router.push('/admin/login'); return }
      setAuthenticated(true)
      return fetch('/api/services')
    }).then(res => res?.json()).then(data => { if (data) setServices(data) })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  const refresh = async () => { setServices(await (await fetch('/api/services')).json()) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch(editingId ? `/api/admin/services/${editingId}` : '/api/admin/services', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    await refresh()
    setForm(emptyForm); setEditingId(null); setShowForm(false); setSaving(false)
  }

  const handleEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description, price: String(s.price), duration: s.duration, category: s.category })
    setEditingId(s.id); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' }); await refresh()
  }

  if (authenticated === null) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="font-body tracking-widest uppercase text-sm text-darkbrown/40">Loading…</p></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
        <div>
          <p className="font-script text-teal-500 text-xl">admin</p>
          <h1 className="font-display text-4xl text-darkbrown">Dashboard</h1>
          <div className="h-0.5 w-10 bg-mustard-400 mt-2 rounded-full" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm) }} className="btn-primary text-xs">
            {showForm && !editingId ? 'Cancel' : '+ Add Service'}
          </button>
          <button onClick={handleLogout} className="btn-secondary text-xs">Logout</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card mb-8 space-y-4">
          <h2 className="font-display text-2xl text-darkbrown">{editingId ? 'Edit Service' : 'New Service'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Service Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="e.g. Gel-X Full Set" />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="input-field">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input-field h-20 resize-none" placeholder="Brief description" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Price ($) *</label>
              <input type="number" required min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="input-field" placeholder="45" />
            </div>
            <div>
              <label className="block font-body text-xs uppercase tracking-widest text-darkbrown/50 mb-1">Duration *</label>
              <input type="text" required value={form.duration} onChange={e => setForm(f => ({...f, duration: e.target.value}))} className="input-field" placeholder="e.g. 60 min" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Update' : 'Add Service'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setShowForm(false); setForm(emptyForm) }} className="btn-secondary">Cancel</button>}
          </div>
        </form>
      )}

      <div className="card p-0 overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-darkbrown text-cream">
              <tr>
                {['Service', 'Category', 'Duration', 'Price', ''].map(h => (
                  <th key={h} className="text-left px-6 py-4 font-body text-xs uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-terracotta-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-sub font-bold text-darkbrown">{s.name}</p>
                    <p className="text-darkbrown/40 text-xs mt-0.5 font-body">{s.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-body font-bold tracking-wider uppercase bg-teal-100 text-teal-700 px-3 py-1 rounded-full">{s.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-body text-sand">{s.duration}</td>
                  <td className="px-6 py-4"><span className="font-script text-xl text-terracotta-500">${s.price}</span></td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => handleEdit(s)} className="text-xs font-body font-bold text-terracotta-500 hover:text-terracotta-700 uppercase tracking-wider">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs font-body font-bold text-darkbrown/30 hover:text-red-500 uppercase tracking-wider">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
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
                <button onClick={() => handleEdit(s)} className="text-xs font-body font-bold text-terracotta-500 uppercase tracking-wider">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs font-body font-bold text-darkbrown/30 uppercase tracking-wider">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
