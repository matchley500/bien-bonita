'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-parchment/95 backdrop-blur-sm sticky top-0 z-50 border-b border-sand/30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/favicon.png"
            alt="Bien Bonita"
            width={48}
            height={48}
            className="rounded-full border-2 border-terracotta-400 shadow-md"
          />
          <div className="leading-tight">
            <span className="font-display text-lg text-terracotta-500 block tracking-widest uppercase font-semibold">BIEN BONITA</span>
            <span className="font-body text-[9px] tracking-[0.3em] uppercase text-sand">Nails & Spa</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="font-body text-xs tracking-widest uppercase text-darkbrown/60 hover:text-terracotta-500 transition-colors">Home</Link>
          <Link href="/#about" className="font-body text-xs tracking-widest uppercase text-darkbrown/60 hover:text-terracotta-500 transition-colors">About</Link>
          <Link href="/book" className="btn-primary !py-2 !px-6 text-xs">Book Now</Link>
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-darkbrown" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
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
        <nav className="md:hidden bg-parchment border-t border-sand/30 px-4 pb-5 pt-3 space-y-3">
          <Link href="/" className="block py-2 font-body text-xs tracking-widest uppercase text-darkbrown/60" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/#about" className="block py-2 font-body text-xs tracking-widest uppercase text-darkbrown/60" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/book" className="btn-primary block text-center mt-3 text-xs" onClick={() => setMenuOpen(false)}>Book Now</Link>
        </nav>
      )}
    </header>
  )
}
