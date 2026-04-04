import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-parchment py-24 md:py-40">
        {/* Organic blob backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-terracotta-200/30 blur-3xl translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-teal-200/30 blur-3xl -translate-x-1/4 translate-y-1/4 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <p className="font-script text-teal-500 text-2xl mb-2">welcome to</p>
          <h1 className="font-display text-6xl md:text-9xl text-darkbrown leading-none mb-3 tracking-wide uppercase">
            BIEN BONITA
          </h1>
          <p className="font-script text-terracotta-500 text-3xl md:text-4xl mb-8">
            Nails &amp; Spa
          </p>
          <p className="font-body text-sm md:text-base text-darkbrown/60 mb-12 max-w-lg mx-auto leading-loose tracking-wide uppercase">
            Premium nail care rooted in the warmth of the Southwest — crafted with love, groove & good vibes.
          </p>
          <Link href="/book" className="btn-primary text-sm px-14 py-4">
            Book Your Session
          </Link>
        </div>
      </section>

      {/* ── Wavy divider terracotta ── */}
      <div className="wave-divider -mt-1">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-16 md:h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1380,20 1440,40 L1440,80 L0,80 Z" fill="#C4622D"/>
        </svg>
      </div>

      {/* ── About ── */}
      <section id="about" className="bg-terracotta-500 text-cream py-16 md:py-24 -mt-1 relative overflow-hidden">

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="font-script text-mustard-300 text-2xl mb-2">my story</p>
              <h2 className="font-display text-4xl md:text-6xl text-cream mb-6 leading-tight uppercase tracking-wide">
                Beauty With Soul
              </h2>
              <div className="w-16 h-1 bg-mustard-400 rounded-full mb-8" />
              <div className="space-y-4 text-cream/75 font-body leading-loose text-sm tracking-wide">
                <p>
                  At BIEN BONITA, I believe every set of nails tells a story.
                  Inspired by the warm hues and desert spirit of the Southwest, and
                  the boho vibes of the San Diego beach.
                </p>
                <p>
                  From Gel-X extensions to hand-painted nail art, luxurious spa pedicures
                  to classic manicures — each service is crafted with meticulous attention
                  to detail and the highest quality products.
                </p>
                <p>
                  Whether you want your everyday look or something special for an occasion,
                  Im here to make you feel pampered and beautiful. ~ {' '}
                  <em className="text-mustard-300 not-italic font-script text-lg">Bien Bonita</em>{' '}
                  <em className="text-cream/60 not-italic font-script text-base">Nails &amp; Spa</em>.
                </p>
              </div>
            </div>

            {/* Groovy circle badge */}
            <div className="flex items-center justify-center">
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-full border-4 border-cream/20" />
                <div className="absolute inset-5 rounded-full border-2 border-mustard-400/40" />
                <div className="absolute inset-10 rounded-full bg-terracotta-600/50 border border-cream/10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <p className="font-body text-[9px] tracking-[0.25em] uppercase text-cream/40">every detail</p>
                  <p className="font-script text-mustard-300 text-2xl mb-1">made</p>
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/50 mb-1">with</p>
                  <p className="font-body text-cream text-3xl mb-3 tracking-widest">LOVE</p>
                  <div className="h-px w-10 bg-mustard-400/60 mb-3" />
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wavy divider teal ── */}
      <div className="wave-divider -mt-1">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-16 md:h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C180,0 360,80 540,40 C720,0 900,80 1080,40 C1260,0 1380,60 1440,40 L1440,0 L0,0 Z" fill="#C4622D"/>
          <path d="M0,60 C200,20 400,80 600,50 C800,20 1000,80 1200,50 C1350,30 1420,60 1440,60 L1440,80 L0,80 Z" fill="#4A8280"/>
        </svg>
      </div>

      {/* ── CTA ── */}
      <section className="bg-teal-500 text-cream py-20 -mt-1 text-center relative overflow-hidden">

        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <p className="font-script text-mustard-300 text-2xl mb-2">ready?</p>
          <h2 className="font-display text-5xl md:text-6xl text-cream mb-4 uppercase tracking-wide">
            Feel BIEN BONITA
          </h2>
          <div className="w-16 h-1 bg-mustard-400 mx-auto mb-8 rounded-full" />
          <p className="text-cream/70 font-body text-sm mb-10 tracking-widest uppercase">
            Choose your services & book in just a few taps.
          </p>
          <Link href="/book" className="bg-mustard-500 text-darkbrown px-14 py-4 rounded-full font-body font-bold tracking-widest uppercase text-sm hover:bg-mustard-400 transition-all duration-200 inline-block shadow-[0_4px_14px_rgba(200,144,16,0.4)] active:scale-95">
            Book Now
          </Link>
        </div>
      </section>

      {/* ── Footer wave transition ── */}
      <div className="wave-divider -mt-1">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,0 L0,0 Z" fill="#4A8280"/>
          <path d="M0,60 L1440,60 L1440,30 C1200,0 960,60 720,30 C480,0 240,60 0,30 Z" fill="#2C1A0E"/>
        </svg>
      </div>
    </>
  )
}
