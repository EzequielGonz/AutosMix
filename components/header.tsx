'use client'

import { useEffect, useState } from 'react'
import {
  Menu,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { useStore } from '@/components/store-context'

const LINKS = [
  { href: '#productos', label: 'Productos' },
  { href: '#categorias', label: 'Categorías' },
  { href: '#marcas', label: 'Marcas' },
  { href: '#nosotros', label: 'Nosotros' },
  { href: '#contacto', label: 'Contacto' },
]

export function Header() {
  const { count, openCart, search, setSearch } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-line bg-ink/85 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[72px]">
        {/* Logo */}
        <a href="#inicio" className="flex shrink-0 items-center gap-3">
          <img
            src="/autosmix-logo.png"
            alt="AutosMix"
            width={140}
            height={48}
            className="h-9 w-auto sm:h-10"
          />
        </a>

        {/* Navegación desktop */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 transition hover:text-white"
            >
              {l.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Buscador desktop */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="h-10 w-44 rounded-full border border-line bg-panel px-4 pl-9 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-300 focus:w-64 focus:border-brand/60 focus:bg-panel-2 focus:shadow-[0_0_0_3px_rgba(225,6,0,0.15)] lg:w-56 lg:focus:w-72"
          />
        </div>

        {/* Carrito */}
        <button
          onClick={openCart}
          aria-label="Abrir carrito"
          className="group relative flex size-10 items-center justify-center rounded-full border border-line bg-panel text-white/80 transition-all duration-300 hover:border-brand/60 hover:text-white hover:shadow-[0_0_20px_rgba(225,6,0,0.35)] lg:size-11"
        >
          <ShoppingBag className="size-[18px] transition-transform duration-300 group-hover:scale-110" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white shadow-lg shadow-brand/40">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>

        {/* Menú móvil */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
          className="flex size-10 items-center justify-center rounded-full border border-line bg-panel text-white/80 transition hover:text-white lg:hidden"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      <div
        className={`overflow-hidden border-t border-line bg-ink/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 border-t-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-panel-2 hover:text-white"
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              {l.label}
            </a>
          ))}
          {/* Buscador móvil */}
          <div className="relative mt-2 px-1 pb-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="h-10 w-full rounded-full border border-line bg-panel px-4 pl-10 text-sm text-white placeholder:text-white/35 outline-none focus:border-brand/60"
            />
          </div>
        </nav>
      </div>
    </header>
  )
}
