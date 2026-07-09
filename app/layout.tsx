import type { Metadata } from 'next'
import { Cormorant_Garamond, Great_Vibes, Playfair_Display, Josefin_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const alfa = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300', '400', '500', '600', '700'],
  variable: '--font-alfa', display: 'swap',
})
const pacifico = Great_Vibes({
  subsets: ['latin'], weight: '400',
  variable: '--font-pacifico', display: 'swap',
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair', display: 'swap',
})
const josefin = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-josefin', display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bien Bonita Nails & Spa',
  description: 'Premium nail services in the Southwest. Gel-X, manicures, pedicures, nail art, and more. Book your appointment today!',
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${alfa.variable} ${pacifico.variable} ${playfair.variable} ${josefin.variable}`}>
      <body className="font-body bg-parchment text-darkbrown min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
