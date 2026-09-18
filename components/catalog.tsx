'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, LayoutGrid, Lightbulb, Package, SearchX, Shield, Sparkles } from 'lucide-react'
import { CATEGORIES, PRODUCTS, SUBCATEGORIES, type Category, type Subcategory } from '@/lib/products'
import { useStore } from '@/components/store-context'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 12

const CATEGORY_ICONS: Record<string, typeof LayoutGrid> = {
  grid: LayoutGrid,
  lightbulb: Lightbulb,
  package: Package,
  shield: Shield,
  sparkles: Sparkles,
}

type Sort = 'relevancia' | 'menor-precio' | 'mayor-precio' | 'rating'

const SORT_LABELS: Record<Sort, string> = {
  relevancia: 'Relevancia',
  'menor-precio': 'Menor precio',
  'mayor-precio': 'Mayor precio',
  rating: 'Mejor valorados',
}

export function Catalog() {
  const { search, setSearch, category, setCategory, subcategory, setSubcategory } = useStore()
  const [sort, setSort] = useState<Sort>('relevancia')
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Subcategorías disponibles para la categoría activa
  const availableSubs = useMemo(
    () =>
      category === 'todos'
        ? []
        : SUBCATEGORIES.filter((s) => s.category === category),
    [category],
  )

  // Si cambia la categoría y la subcategoría activa ya no corresponde, resetear
  useEffect(() => {
    if (subcategory && !availableSubs.some((s) => s.id === subcategory)) {
      setSubcategory(null)
    }
  }, [category, subcategory, availableSubs, setSubcategory])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = PRODUCTS.filter((p) => {
      const okCat = category === 'todos' || p.category === (category as Category)
      const okSub = !subcategory || p.subcategory === subcategory
      const subLabel = SUBCATEGORIES.find((s) => s.id === p.subcategory)?.label ?? ''
      const okSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        subLabel.toLowerCase().includes(q) ||
        (CATEGORIES.find((c) => c.id === p.category)?.label.toLowerCase().includes(q) ?? false)
      return okCat && okSub && okSearch
    })
    switch (sort) {
      case 'menor-precio':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'mayor-precio':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list = [...list].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
        break
      default:
        // Relevancia: destacados primero, luego rating
        list = [...list].sort(
          (a, b) =>
            (b.badge === 'MÁS VENDIDO' ? 1 : 0) - (a.badge === 'MÁS VENDIDO' ? 1 : 0) ||
            b.rating - a.rating,
        )
    }
    return list
  }, [search, category, subcategory, sort])

  // Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [search, category, subcategory, sort])

  const setCatAndGo = (c: Category | 'todos') => {
    setCategory(c)
    setSubcategory(null)
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  const activeCatLabel = CATEGORIES.find((c) => c.id === category)?.label

  return (
    <section id="productos" className="relative scroll-mt-20 py-20 sm:py-24">
      {/* Acento de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_0%,rgba(225,6,0,0.07),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Encabezado */}
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Catálogo completo</p>
            <h2 className="mt-2 font-display text-3xl uppercase leading-tight sm:text-5xl">
              Todos los <span className="text-brand">productos</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-white/50">
            Stock real de nuestro local. Elegí, consultá y te lo despachamos a todo el país.
          </p>
        </Reveal>

        {/* Barra de filtros */}
        <Reveal delay={100} className="sticky top-16 z-30 mt-8 lg:top-[72px]">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-ink/80 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:flex-row lg:items-center">
            {/* Chips de categoría */}
            <div className="flex flex-1 flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.icon] ?? LayoutGrid
                const active = category === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setCatAndGo(c.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-300',
                      active
                        ? 'bg-brand text-white shadow-[0_4px_18px_rgba(225,6,0,0.45)]'
                        : 'border border-line bg-panel text-white/60 hover:border-brand/50 hover:text-white',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {c.label}
                  </button>
                )
              })}
            </div>

            {/* Orden */}
            <div className="relative shrink-0">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/40" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-9 w-full cursor-pointer appearance-none rounded-full border border-line bg-panel pl-9 pr-8 text-xs font-semibold text-white/80 outline-none transition hover:border-brand/50 focus:border-brand/60 lg:w-44"
              >
                {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                  <option key={s} value={s} className="bg-panel text-white">
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategorías de la categoría activa */}
          {availableSubs.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">
                {activeCatLabel}:
              </span>
              {availableSubs.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubcategory(subcategory === s.id ? null : s.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300',
                    subcategory === s.id
                      ? 'bg-white text-black'
                      : 'border border-line bg-panel text-white/55 hover:border-brand/50 hover:text-white',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </Reveal>

        {/* Resultados */}
        <div className="mt-4 flex items-center justify-between text-xs text-white/40">
          <span>
            {filtered.length} producto{filtered.length !== 1 && 's'}
            {category !== 'todos' && (
              <> en <span className="font-semibold text-brand">{activeCatLabel}</span></>
            )}
            {subcategory && (
              <> · <span className="font-semibold text-white">{SUBCATEGORIES.find((s) => s.id === subcategory)?.label}</span></>
            )}
            {search && (
              <> para <span className="font-semibold text-white">&ldquo;{search}&rdquo;</span></>
            )}
          </span>
          {(search || category !== 'todos' || subcategory) && (
            <button
              onClick={() => {
                setSearch('')
                setCategory('todos')
                setSubcategory(null)
              }}
              className="rounded-full border border-line px-3 py-1 font-semibold text-white/60 transition hover:border-brand/60 hover:text-white"
            >
              Limpiar filtros ✕
            </button>
          )}
        </div>

        {/* Grilla */}
        {filtered.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, visible).map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>

            {visible < filtered.length && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="group relative overflow-hidden rounded-xl border border-brand/50 bg-brand/10 px-8 py-3.5 font-display text-sm uppercase tracking-wide text-white transition-all duration-300 hover:bg-brand hover:shadow-[0_10px_35px_rgba(225,6,0,0.45)]"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Ver más productos ({filtered.length - visible})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-line bg-panel/60 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-brand/10">
              <SearchX className="size-8 text-brand" />
            </div>
            <div>
              <p className="font-display text-lg uppercase">Sin resultados</p>
              <p className="mt-1 text-sm text-white/50">
                No encontramos productos con ese criterio. Probá con otra búsqueda.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('')
                setCategory('todos')
                setSubcategory(null)
              }}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:bg-brand-600"
            >
              Ver todo el catálogo
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
