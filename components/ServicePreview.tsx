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
  manicure:   'Manicures',
  pedicure:   'Pedicures',
  gel:        'Gel Polish',
  extensions: 'Extensions',
  removals:   'Removals',
  designs:    'Designs',
  addons:     'Add-Ons',
}

const categoryColors: Record<string, string> = {
  manicure:   'bg-terracotta-500',
  pedicure:   'bg-teal-500',
  gel:        'bg-forest-500',
  extensions: 'bg-mustard-500 text-darkbrown',
  removals:   'bg-terracotta-700',
  designs:    'bg-teal-600',
  addons:     'bg-forest-600',
}

const categoryOrder = ['manicure', 'pedicure', 'gel', 'extensions', 'removals', 'designs', 'addons']

export default function ServicePreview() {
  const [services, setServices] = useState<Service[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(setServices)
  }, [])

  const categories = ['all', ...categoryOrder.filter(c => services.some(s => s.category === c))]
  const filtered = activeCategory === 'all' ? services : services.filter(s => s.category === activeCategory)

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 font-body font-bold text-xs tracking-widest uppercase rounded-full border-2 transition-all ${
              activeCategory === cat
                ? 'bg-darkbrown border-darkbrown text-cream shadow-md'
                : 'border-darkbrown/20 text-darkbrown/50 hover:border-darkbrown/40'
            }`}
          >
            {cat === 'all' ? 'All Services' : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(service => (
          <div key={service.id} className="card flex flex-col hover:shadow-[0_6px_30px_rgba(44,26,14,0.13)] transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-body font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full text-cream ${categoryColors[service.category] ?? 'bg-darkbrown'}`}>
                {categoryLabels[service.category] || service.category}
              </span>
              <span className="text-xs text-sand font-body tracking-wider">{service.duration}</span>
            </div>
            <h3 className="font-sub text-lg font-bold text-darkbrown mb-2">{service.name}</h3>
            <p className="text-darkbrown/55 text-sm font-body mb-4 leading-relaxed flex-1">{service.description}</p>
            <div className="pt-3 border-t border-sand/40 flex items-center justify-between">
              <span className="font-script text-2xl text-terracotta-500">${service.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
