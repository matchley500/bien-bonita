import Link from 'next/link'
import ServicePreview from '@/components/ServicePreview'

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-sand-50 via-warmwhite to-terracotta-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-terracotta-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-sage-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sage-500 font-body tracking-[0.3em] uppercase text-sm mb-4">
              Southwest&apos;s Premier Nail Studio
            </p>
            <h1 className="font-display text-5xl md:text-7xl text-darkbrown italic leading-tight mb-6">
              Bien Bonita
              <span className="block text-terracotta-500">Nails & Spa</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-sand-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Where desert warmth meets artistry. Treat yourself to premium nail care
              crafted with love and precision.
            </p>
            <div className="flex justify-center">
              <Link href="/book" className="btn-primary text-lg px-10 py-4">
                Book Your Session
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 30C1440 30 1200 0 720 0C240 0 0 30 0 30L0 60Z" fill="#FDF8F4"/>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-terracotta-500 font-body tracking-[0.2em] uppercase text-sm mb-2">
              What We Offer
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-darkbrown italic">
              Our Services
            </h2>
            <div className="mt-4 w-20 h-0.5 bg-gold mx-auto" />
          </div>

          <ServicePreview />

          <div className="text-center mt-12">
            <Link href="/book" className="btn-primary text-lg px-10">
              Book Your Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-gradient-to-br from-sand-50 to-warmwhite">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-terracotta-500 font-body tracking-[0.2em] uppercase text-sm mb-2">
                About Us
              </p>
              <h2 className="font-display text-3xl md:text-5xl text-darkbrown italic mb-6">
                Beauty Inspired by the Desert
              </h2>
              <div className="space-y-4 text-sand-600 font-body leading-relaxed">
                <p>
                  At Bien Bonita Nails & Spa, we believe every set of nails tells a story.
                  Inspired by the warm hues and natural beauty of the Southwest, we bring
                  artistry and care to every appointment.
                </p>
                <p>
                  From classic manicures to intricate nail art, Gel-X extensions to luxurious
                  spa pedicures &mdash; each service is performed with meticulous attention to
                  detail and the highest quality products.
                </p>
                <p>
                  Whether you&apos;re looking for your everyday signature look or something
                  special for an occasion, we&apos;re here to make you feel <em>bien bonita</em>.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-terracotta-100 to-sand-200 rounded-3xl aspect-square flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 bg-terracotta-500/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-terracotta-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="font-display text-2xl text-darkbrown italic mb-2">Made with Love</p>
                  <p className="text-sand-500 font-body">Every nail, every detail</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-sage-200 rounded-2xl -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-terracotta-200 rounded-xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-darkbrown text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl text-white italic mb-4">
            Ready to Feel Bonita?
          </h2>
          <p className="text-sand-300 font-body text-lg mb-8">
            Choose your services and book your next appointment in just a few taps.
          </p>
          <Link href="/book" className="bg-terracotta-500 text-white px-10 py-4 rounded-full font-body font-semibold text-lg hover:bg-terracotta-400 transition-colors inline-block">
            Book Now
          </Link>
        </div>
      </section>
    </>
  )
}
