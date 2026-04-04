import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-darkbrown text-sand-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl text-white italic mb-3">Bien Bonita</h3>
            <p className="text-sand-300 text-sm leading-relaxed">
              Premium nail care in the heart of the Southwest. Where beauty meets desert warmth.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-bold text-white mb-3 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-terracotta-400 transition-colors">Home</Link></li>
              <li><Link href="/book" className="hover:text-terracotta-400 transition-colors">Services & Booking</Link></li>
              <li><Link href="/book" className="hover:text-terracotta-400 transition-colors">Book an Appointment</Link></li>
              <li><Link href="/admin/login" className="hover:text-terracotta-400 transition-colors text-sand-400">Admin</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-bold text-white mb-3 uppercase tracking-wider text-sm">Get in Touch</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-terracotta-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                bienbonitanailandspa@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-terracotta-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Southwest, USA
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-sand-800 text-center text-xs text-sand-400">
          &copy; {new Date().getFullYear()} Bien Bonita Nails & Spa. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
