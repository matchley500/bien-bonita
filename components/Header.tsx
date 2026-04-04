'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-warmwhite/95 backdrop-blur-sm sticky top-0 z-50 border-b border-sand-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl md:text-3xl text-terracotta-500 italic">
            Bien Bonita
          </span>
          <span className="hidden sm:inline text-sm text-sand-400 font-body tracking-widest uppercase">
            Nails & Spa
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-body text-darkbrown hover:text-terracotta-500 transition-colors">
            Home
          </Link>
          <Link href="/book" className="font-body text-darkbrown hover:text-terracotta-500 transition-colors">
            Services & Booking
          </Link>
          <Link href="/#about" className="font-body text-darkbrown hover:text-terracotta-500 transition-colors">
            About
          </Link>
          <Link href="/book" className="btn-primary text-sm">
            Book Now
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-darkbrown"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden bg-warmwhite border-t border-sand-100 px-4 pb-4 space-y-3">
          <Link href="/" className="block py-2 font-body text-darkbrown hover:text-terracotta-500" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/book" className="block py-2 font-body text-darkbrown hover:text-terracotta-500" onClick={() => setMenuOpen(false)}>
            Services & Booking
          </Link>
          <Link href="/#about" className="block py-2 font-body text-darkbrown hover:text-terracotta-500" onClick={() => setMenuOpen(false)}>
            About
          </Link>
          <Link href="/book" className="btn-primary text-sm block text-center" onClick={() => setMenuOpen(false)}>
            Book Now
          </Link>
        </nav>
      )}
    </header>
  )
}
