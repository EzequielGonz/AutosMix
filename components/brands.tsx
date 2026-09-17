'use client'

import { BadgeCheck, MapPin, PackageCheck, Users } from 'lucide-react'
import { BRANDS } from '@/lib/products'
import { Reveal } from '@/components/reveal'

const STATS = [
  { icon: Users, value: '+970', label: 'Seguidores en MercadoLibre' },
  { icon: PackageCheck, value: '+500', label: 'Ventas concretadas' },
  { icon: BadgeCheck, value: '4.8★', label: 'Reputación dorada' },
  { icon: MapPin, value: 'MDP', label: 'Bordabehere 3111' },
]

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
                vehicular y accesorios. Elegimos cada producto probándolo en el taller, porque
                también somos usuarios. Vendemos en MercadoLibre con reputación dorada y despachamos
                a todo el país todos los días.
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

            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 90}>
                  <div className="group flex flex-col items-center gap-1 rounded-3xl border border-line bg-ink p-8 text-center transition-all duration-500 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_15px_40px_rgba(225,6,0,0.2)]">
                    <s.icon className="size-6 text-brand transition-transform duration-500 group-hover:scale-125" />
                    <span className="mt-2 font-display text-3xl text-white">{s.value}</span>
                    <span className="text-xs text-white/45">{s.label}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
