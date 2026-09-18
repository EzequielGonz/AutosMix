'use client'

import { Star } from 'lucide-react'
import { BRANDS } from '@/lib/products'
import { Reveal } from '@/components/reveal'

const GOOGLE = {
  rating: '4.8',
  stars: 5,
  url: 'https://www.google.com/maps/search/?api=1&query=AutosMix+Bordabehere+3111+Mar+del+Plata',
}

export function Brands() {
  const marquee = [...BRANDS, ...BRANDS]

  return (
    <>
      {/* ── Marcas: cinta infinita ─────────────────────────────────────────── */}
      <section id="marcas" className="relative scroll-mt-20 overflow-hidden border-y border-line bg-panel py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Distribuidores</p>
            <h2 className="mt-2 font-display text-3xl uppercase sm:text-4xl">
              Trabajamos con las <span className="text-brand">mejores marcas</span>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="relative">
            {/* Fundidos laterales */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-panel to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-panel to-transparent" />

            <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
              {marquee.map((brand, i) => (
                <div
                  key={brand + i}
                  className="flex h-20 w-52 shrink-0 items-center justify-center rounded-2xl border border-line bg-ink transition-all duration-300 hover:border-brand/60 hover:shadow-[0_0_30px_rgba(225,6,0,0.25)]"
                >
                  <span className="font-display text-xl uppercase tracking-wide text-white/80 transition-colors hover:text-brand">
                    {brand}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Nosotros / stats ─────────────────────────────────────────────── */}
        <div id="nosotros" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">¿Quiénes somos?</p>
              <h2 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-4xl">
                Un local de barrio con <span className="text-brand">nivel nacional</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/55">
                En <strong className="text-white">AutosMix</strong> nos especializamos en iluminación
                vehicular y accesorios.                Elegimos cada producto probándolo en el taller, porque
                también somos usuarios. Despachamos a todo el país todos los días y también
                podés encontrarnos en MercadoLibre.
              </p>
              <p className="mt-3 leading-relaxed text-white/55">
                ¿Estás en Mar del Plata? Vení a vernos a{' '}
                <strong className="text-white">Bordabehere 3111</strong> y probá la diferencia que
                hace una buena iluminación LED.
              </p>
              <a
                href="#contacto"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-[0_10px_30px_rgba(225,6,0,0.45)]"
              >
                Cómo llegar
              </a>
            </Reveal>

            <Reveal delay={150}>
              <a
                href={GOOGLE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-3xl border border-line bg-ink p-8 text-center transition-all duration-500 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_15px_40px_rgba(225,6,0,0.2)] sm:p-10"
              >
                {/* Logo de Google (multi color) */}
                <svg viewBox="0 0 48 48" className="size-10" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C36.9 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                </svg>
                <div className="flex items-end gap-2">
                  <span className="font-display text-5xl text-white">{GOOGLE.rating}</span>
                  <Star className="mb-1 size-6 fill-amber-400 text-amber-400 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125" />
                </div>
                <div className="flex gap-0.5" aria-label="5 estrellas">
                  {Array.from({ length: GOOGLE.stars }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/55">Calificación en Google Business</p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand transition-all duration-300 group-hover:gap-3">
                  Ver reseñas
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H8m9 0v9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
