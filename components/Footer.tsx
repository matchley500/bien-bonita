import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-darkbrown text-sand">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Image src="/favicon.png" alt="Bien Bonita" width={64} height={64} className="rounded-full border-2 border-terracotta-400" />
            <div>
              <p className="font-body text-terracotta-500 text-2xl tracking-widest">BIEN BONITA</p>
              <p className="font-script text-base text-sand/60 mb-3">Nails &amp; Spa</p>
              <p className="text-sand/60 text-xs leading-relaxed font-body tracking-wide">
                Premium nail care rooted in the warmth of the Southwest.
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-body font-bold text-cream/80 mb-4 uppercase tracking-widest text-xs">Navigate</h4>
            <ul className="space-y-2 text-sm font-body">
              <li><Link href="/" className="hover:text-terracotta-400 transition-colors text-sand/60">Home</Link></li>
              <li><Link href="/book" className="hover:text-terracotta-400 transition-colors text-sand/60">Services & Booking</Link></li>
              <li><Link href="/#about" className="hover:text-terracotta-400 transition-colors text-sand/60">About</Link></li>
              <li><Link href="/admin/login" className="hover:text-terracotta-400 transition-colors text-sand/30 text-xs">Admin</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-bold text-cream/80 mb-4 uppercase tracking-widest text-xs">Get in Touch</h4>
            <ul className="space-y-3 text-sm font-body text-sand/60">
              <li className="flex items-center gap-2">
                <span className="text-terracotta-400">✉</span>
                bienbonitanailandspa@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <span className="text-terracotta-400">⌖</span>
                Southwest, USA
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-sand/10 text-center">
          <p className="font-body text-terracotta-400/60 text-lg mb-1 tracking-widest">BIEN BONITA</p>
          <p className="text-xs text-sand/30 font-body tracking-widest uppercase">
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
