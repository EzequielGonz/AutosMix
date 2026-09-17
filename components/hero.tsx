'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ShieldCheck, Sparkles, Truck, Wrench, Zap } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useStore } from '@/components/store-context'

const BENEFITS = [
  { icon: Zap, title: 'Iluminación LED', text: '12 y 24V · Chips Cree y Osram' },
  { icon: Truck, title: 'Envío gratis', text: 'En compras desde $35.000' },
  { icon: ShieldCheck, title: 'Garantía real', text: 'Productos con respaldo oficial' },
  { icon: Wrench, title: 'Asesoramiento', text: 'Te ayudamos a elegir lo justo' },
]

export function Hero() {
  const { setCategory } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      id="inicio"
      className="relative flex min-h-[92svh] items-center overflow-hidden pt-20 pb-16"
    >
      {/* ── Fondo: logo gigante desenfocado ─────────────────────────────── */}
      <div className="absolute inset-0" aria-hidden>
        {/* Halo rojo ambiental */}
        <div className="absolute left-1/2 top-[42%] size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[140px] animate-glow" />
        {/* Logo de fondo con blur */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/autosmix-logo-full.png"
          alt=""
          className="absolute left-1/2 top-1/2 w-[135%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-25 blur-[6px] scale-105 sm:w-[110%] lg:w-[85%] lg:opacity-30 select-none"
          draggable={false}
        />
        {/* Veladura para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_45%,transparent_30%,rgba(5,5,5,0.55)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h1 className="sr-only">AutosMix — Iluminación LED y accesorios para vehículos en Mar del Plata</h1>
        {/* Logo principal en primer plano */}
        <div
          className={`flex justify-center transition-all duration-1000 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/autosmix-logo-full.png"
            alt="AutosMix"
            width={560}
            height={184}
            className="w-72 max-w-full drop-shadow-[0_10px_45px_rgba(225,6,0,0.35)] sm:w-96 lg:w-[440px] animate-float"
            draggable={false}
          />
        </div>

        {/* Badge */}
        <div
          className={`mt-10 flex justify-center transition-all duration-1000 delay-150 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur">
            <Sparkles className="size-3.5 text-brand" />
            +970 seguidores en MercadoLibre · Tienda oficial
          </span>
        </div>

        {/* Subtítulo */}
        <p
          className={`mx-auto mt-5 max-w-xl text-center text-base leading-relaxed text-white/70 sm:text-lg transition-all duration-1000 delay-200 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          Iluminación LED 12/24V, accesorios, alarmas y estética vehicular.
          Las mejores marcas al mejor precio, con envío a todo el país desde{' '}
          <span className="font-semibold text-white">Mar del Plata</span>.
        </p>

        {/* CTAs */}
        <div
          className={`mt-8 flex flex-wrap items-center justify-center gap-4 transition-all duration-1000 delay-300 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <a
            href="#productos"
            className="group relative overflow-hidden rounded-xl bg-brand px-7 py-3.5 font-display text-sm tracking-wide text-white uppercase shadow-[0_8px_30px_rgba(225,6,0,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-[0_12px_40px_rgba(225,6,0,0.55)] active:translate-y-0"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            Ver productos
          </a>
          <a
            href="#marcas"
            className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-display text-sm tracking-wide text-white uppercase backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-brand/10"
          >
            Nuestras marcas
          </a>
        </div>

        {/* Beneficios rápidos */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 90}>
              <div className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-panel/70 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:bg-panel-2 hover:shadow-[0_10px_35px_rgba(225,6,0,0.15)]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white">
                  <b.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-white/50">{b.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Chips de categorías */}
        <Reveal delay={200} className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs uppercase tracking-widest text-white/40">Comprar por:</span>
          {[
            { label: 'Iluminación', icon: Zap, cat: 'iluminacion' as const },
            { label: 'Accesorios', icon: Sparkles, cat: 'accesorios' as const },
            { label: 'Alarmas', icon: ShieldCheck, cat: 'alarmas' as const },
            { label: 'Estética', icon: Sparkles, cat: 'estetica' as const },
          ].map((c) => (
            <a
              key={c.cat}
              href="#productos"
              onClick={() => setCategory(c.cat)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-medium text-white/70 transition-all duration-300 hover:border-brand/60 hover:bg-brand/10 hover:text-white"
            >
              <c.icon className="size-3.5 text-brand" />
              {c.label}
            </a>
          ))}
        </Reveal>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/35 sm:flex">
        <span className="text-[10px] uppercase tracking-[0.3em]">Deslizá</span>
        <ChevronDown className="size-4 animate-scroll-hint" />
      </div>
    </section>
  )
}
