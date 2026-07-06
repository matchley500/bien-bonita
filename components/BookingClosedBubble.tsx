'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BookingClosedBubble() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(true)
  const pathname = usePathname()

  // Don't show on admin or auth pages
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/login') || pathname?.startsWith('/dashboard')

  useEffect(() => {
    if (isAdminPage) return
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bb-bubble-dismissed')) {
      setDismissed(true)
      return
    }
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (!d.bookingOpen) setBookingOpen(false) })
      .catch(() => {})
  }, [isAdminPage])

  useEffect(() => {
    if (bookingOpen || dismissed || isAdminPage) return
    const onScroll = () => { if (window.scrollY > 180) setShow(true) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [bookingOpen, dismissed, isAdminPage])

  const handleDismiss = () => {
    setDismissed(true)
    setShow(false)
    sessionStorage.setItem('bb-bubble-dismissed', '1')
  }

  if (!show || dismissed || bookingOpen || isAdminPage) return null

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-darkbrown rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-terracotta-500 px-5 py-3 flex items-center justify-between">
          <p className="font-script text-cream text-xl leading-tight">Bien Bonita</p>
          <button
            onClick={handleDismiss}
            className="text-cream/60 hover:text-cream text-lg leading-none transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="font-display text-cream text-lg leading-snug">
            Thank you for visiting Bien Bonita Nails &amp; Spa!
          </p>
          <p className="font-body text-cream/70 text-sm leading-relaxed tracking-wide">
            Online booking is currently <strong className="text-mustard-300">closed for new clients</strong>.
            If you&rsquo;re an existing client, log in to view your appointments.
          </p>
          <div className="flex gap-3 pt-1">
            <Link
              href="/login"
              onClick={handleDismiss}
              className="flex-1 text-center bg-terracotta-500 hover:bg-terracotta-600 text-cream font-body font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-xl transition-colors"
            >
              Client Login
            </Link>
            <button
              onClick={handleDismiss}
              className="flex-1 text-center border border-cream/20 text-cream/50 hover:text-cream font-body text-xs uppercase tracking-widest py-2.5 px-4 rounded-xl transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
