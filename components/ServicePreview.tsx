'use client'

import { useEffect, useState } from 'react'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  category: string
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

const categoryIcons: Record<string, string> = {
  manicure: '✨',
  pedicure: '🦶',
  gel: '💿',
  extensions: '💅',
  removals: '🧴',
  designs: '🎨',
  addons: '🔧',
}

export default function ServicePreview() {
  const [services, setServices] = useState<Service[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(setServices)
  }, [])

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))]
  const filtered = activeCategory === 'all' ? services : services.filter(s => s.category === activeCategory)

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full font-body text-sm transition-colors ${
              activeCategory === cat
                ? 'bg-terracotta-500 text-white'
                : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
            }`}
          >
            {cat === 'all' ? 'All Services' : `${categoryIcons[cat] || ''} ${categoryLabels[cat] || cat}`}
          </button>
        ))}
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(service => (
          <div key={service.id} className="card group">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-body tracking-wider uppercase text-sage-500 bg-sage-50 px-3 py-1 rounded-full">
                {categoryLabels[service.category] || service.category}
              </span>
              <span className="text-xs text-sand-400 font-body">{service.duration}</span>
            </div>
            <h3 className="font-display text-xl text-darkbrown mb-2">{service.name}</h3>
            <p className="text-sand-500 text-sm font-body mb-4 leading-relaxed">{service.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-sand-100">
              <span className="font-display text-2xl text-terracotta-500">${service.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
