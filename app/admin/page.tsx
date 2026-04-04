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
  { value: 'manicure', label: 'Manicures' },
  { value: 'pedicure', label: 'Pedicures' },
  { value: 'gel', label: 'Gel Polish' },
  { value: 'extensions', label: 'Extensions' },
  { value: 'removals', label: 'Removals' },
  { value: 'designs', label: 'Designs' },
  { value: 'addons', label: 'Add-Ons' },
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
    fetch('/api/admin/check')
      .then(res => {
        if (!res.ok) {
          router.push('/admin/login')
          return
        }
        setAuthenticated(true)
        return fetch('/api/services')
      })
      .then(res => res?.json())
      .then(data => { if (data) setServices(data) })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  const refreshServices = async () => {
    const res = await fetch('/api/services')
    setServices(await res.json())
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const url = editingId
      ? `/api/admin/services/${editingId}`
      : '/api/admin/services'

    await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    await refreshServices()
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setSaving(false)
  }

  const handleEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      duration: service.duration,
      category: service.category,
    })
    setEditingId(service.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
    await refreshServices()
  }

  if (authenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sand-400 font-body">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-darkbrown italic">Admin Dashboard</h1>
          <p className="text-sand-400 font-body text-sm mt-1">Manage your services and pricing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setForm(emptyForm)
              setEditingId(null)
              setShowForm(!showForm)
            }}
            className="btn-primary text-sm"
          >
            {showForm && !editingId ? 'Cancel' : '+ Add Service'}
          </button>
          <button onClick={handleLogout} className="btn-secondary text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="card mb-8 space-y-4">
          <h2 className="font-display text-xl text-darkbrown">
            {editingId ? 'Edit Service' : 'Add New Service'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-sand-600 mb-1">Service Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input-field"
                placeholder="e.g. Gel-X Full Set"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-sand-600 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="input-field"
              >
                {categories.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-sand-600 mb-1">Description *</label>
            <textarea
              required
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field h-20 resize-none"
              placeholder="Brief description of the service"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-sand-600 mb-1">Price ($) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="input-field"
                placeholder="45"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-sand-600 mb-1">Duration *</label>
              <input
                type="text"
                required
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="input-field"
                placeholder="e.g. 60 min"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setShowForm(false); setForm(emptyForm) }}
                className="btn-secondary"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      )}

      {/* Services Table */}
      <div className="card overflow-hidden p-0">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sand-50 border-b border-sand-100">
              <tr>
                <th className="text-left px-6 py-4 font-body text-xs uppercase tracking-wider text-sand-500">Service</th>
                <th className="text-left px-6 py-4 font-body text-xs uppercase tracking-wider text-sand-500">Category</th>
                <th className="text-left px-6 py-4 font-body text-xs uppercase tracking-wider text-sand-500">Duration</th>
                <th className="text-left px-6 py-4 font-body text-xs uppercase tracking-wider text-sand-500">Price</th>
                <th className="text-right px-6 py-4 font-body text-xs uppercase tracking-wider text-sand-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-50">
              {services.map(service => (
                <tr key={service.id} className="hover:bg-sand-50/50">
                  <td className="px-6 py-4">
                    <p className="font-body font-semibold text-darkbrown">{service.name}</p>
                    <p className="text-sand-400 text-xs mt-0.5">{service.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-body tracking-wider uppercase text-sage-500 bg-sage-50 px-3 py-1 rounded-full">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-body text-sand-500">{service.duration}</td>
                  <td className="px-6 py-4 font-display text-lg text-terracotta-500">${service.price}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-sm text-terracotta-500 hover:text-terracotta-700 font-body mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-sm text-red-400 hover:text-red-600 font-body"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-sand-100">
          {services.map(service => (
            <div key={service.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body font-semibold text-darkbrown">{service.name}</p>
                  <span className="text-xs font-body text-sage-500">{service.category} &middot; {service.duration}</span>
                </div>
                <span className="font-display text-xl text-terracotta-500">${service.price}</span>
              </div>
              <p className="text-sand-400 text-xs">{service.description}</p>
              <div className="flex gap-4 pt-1">
                <button
                  onClick={() => handleEdit(service)}
                  className="text-sm text-terracotta-500 font-body font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-sm text-red-400 font-body font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
