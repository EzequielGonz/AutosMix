'use client'

import { LayoutGrid, Lightbulb, Package, Shield, Sparkles } from 'lucide-react'
import { CATEGORIES, PRODUCTS, SUBCATEGORIES, type Category, type Subcategory } from '@/lib/products'
import { useStore } from '@/components/store-context'
import { Reveal } from '@/components/reveal'

const ICONS: Record<string, typeof LayoutGrid> = {
  grid: LayoutGrid,
  lightbulb: Lightbulb,
  package: Package,
  shield: Shield,
  sparkles: Sparkles,
}

// Gradientes de fondo por categoría
const CARD_STYLES: Record<string, string> = {
  iluminacion:
    'bg-[radial-gradient(ellipse_at_bottom_left,rgba(225,6,0,0.35),transparent_55%),linear-gradient(160deg,#1a1a1a_0%,#0a0a0a_100%)] md:row-span-2 md:min-h-[420px]',
  accesorios:
    'bg-[radial-gradient(ellipse_at_top_right,rgba(225,6,0,0.14),transparent_60%),linear-gradient(160deg,#161616,#0a0a0a)]',
  seguridad:
    'bg-[radial-gradient(ellipse_at_bottom_right,rgba(225,6,0,0.14),transparent_60%),linear-gradient(160deg,#161616,#0a0a0a)]',
  estetica:
    'bg-[radial-gradient(ellipse_at_top_left,rgba(225,6,0,0.12),transparent_60%),linear-gradient(160deg,#161616,#0a0a0a)]',
}

const DESCRIPTIONS: Record<string, string> = {
  iluminacion: 'Faros, barras y kits LED 12/24V, halógenas y luces de posición. Lo que más sale de nuestro local.',
  accesorios: 'Estéreos, cargadores, medidores y todo para equipar tu vehículo.',
  seguridad: 'Alarmas, cierres centralizados, tuercas antirrobo y criques.',
  estetica: 'Línea completa de estética vehicular. ¡Nuevos ingresos todos los meses!',
}

export function Categories() {
  const { setCategory, setSubcategory } = useStore()

  const go = (c: Category | 'todos', sub?: Subcategory) => {
    setCategory(c)
    setSubcategory(sub ?? null)
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  const counts = CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] =
      c.id === 'todos' ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length
    return acc
  }, {})

  return (
    <section id="categorias" className="relative scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Rubros</p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-5xl">
            Comprá por <span className="text-brand">categoría</span>
          </h2>
          <p className="mt-3 text-sm text-white/50 sm:text-base">
            Cuatro rubros, un solo lugar: iluminación profesional, accesorios, seguridad y estética.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {CATEGORIES.filter((c) => c.id !== 'todos').map((c, i) => {
            const Icon = ICONS[c.icon] ?? LayoutGrid
            const subs = SUBCATEGORIES.filter((s) => s.category === c.id)
            return (
              <Reveal key={c.id} delay={i * 80} className={c.id === 'iluminacion' ? 'md:row-span-2' : ''}>
                <button
                  onClick={() => go(c.id as Category)}
                  className={`group relative flex h-full min-h-44 w-full flex-col justify-between overflow-hidden rounded-3xl border border-line p-6 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/60 hover:shadow-[0_25px_60px_-15px_rgba(225,6,0,0.4)] ${CARD_STYLES[c.id]}`}
                >
                  {/* Brillo al hover */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

                  <div className="flex items-start justify-between">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl transition-all duration-500 ${
                        c.id === 'iluminacion'
                          ? 'bg-brand text-white shadow-[0_0_30px_rgba(225,6,0,0.5)] group-hover:scale-110 group-hover:rotate-6'
                          : 'bg-brand/15 text-brand group-hover:bg-brand group-hover:text-white'
                      }`}
                    >
                      <Icon className="size-6" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-white/60 backdrop-blur">
                      {counts[c.id]} prod.
                    </span>
                  </div>

                  <div className="relative mt-6">
                    <h3
                      className={`font-display uppercase leading-tight ${
                        c.id === 'iluminacion' ? 'text-2xl sm:text-3xl' : 'text-lg'
                      }`}
                    >
                      {c.label}
                    </h3>
                    <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-white/50 sm:text-sm">
                      {DESCRIPTIONS[c.id]}
                    </p>

                    {/* Subcategorías clickeables */}
                    {subs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {subs.map((s) => (
                          <span
                            key={s.id}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              go(c.id as Category, s.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                go(c.id as Category, s.id as Subcategory)
                              }
                            }}
                            className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/60 backdrop-blur transition-all duration-300 hover:border-brand/60 hover:bg-brand hover:text-white"
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand transition-all duration-300 group-hover:gap-3">
                      Ver productos
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
