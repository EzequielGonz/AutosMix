'use client'

import { Clock, CreditCard, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react'
import { CATEGORIES, STORE, type Category } from '@/lib/products'
import { useStore } from '@/components/store-context'
import { Reveal } from '@/components/reveal'

export function Footer() {
  const { setCategory } = useStore()

  const goCat = (id: string) => {
    setCategory(id as Category | 'todos')
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer id="contacto" className="relative scroll-mt-20 border-t border-line bg-panel">
      {/* ── Contacto + Mapa ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-brand">Contacto</p>
          <h2 className="mt-2 font-display text-3xl uppercase sm:text-4xl">
            Visitá el <span className="text-brand">local</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-5">
          {/* Info de contacto */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Reveal>
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-ink p-5 transition hover:border-brand/50">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Dirección</p>
                  <p className="mt-0.5 text-sm text-white/55">{STORE.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-bold uppercase tracking-widest text-brand hover:underline"
                  >
                    Abrir en Maps →
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-ink p-5 transition hover:border-brand/50">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Phone className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">WhatsApp</p>
                  <p className="mt-0.5 text-sm text-white/55">{STORE.whatsappDisplay}</p>
                  <a
                    href={`https://wa.me/${STORE.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-bold uppercase tracking-widest text-brand hover:underline"
                  >
                    Escribinos →
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="flex items-start gap-4 rounded-2xl border border-line bg-ink p-5 transition hover:border-brand/50">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Horarios</p>
                  <p className="mt-0.5 text-sm text-white/55">Lunes a sábados · 9 a 13 hs y 16 a 18 hs</p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Mapa */}
          <Reveal delay={120} className="lg:col-span-3">
            <div className="h-full min-h-72 overflow-hidden rounded-2xl border border-line">
              <iframe
                title="Ubicación AutosMix"
                src="https://www.google.com/maps?q=Bordabehere%203111%2C%20Mar%20del%20Plata&output=embed"
                className="h-full min-h-72 w-full grayscale-[35%] invert-[92%] hue-rotate-180 contrast-[0.9]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Enlaces ─────────────────────────────────────────────────────── */}
      <div className="border-t border-line bg-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          {/* Marca */}
          <div>
            <img src="/autosmix-logo.png" alt="AutosMix" className="h-12 w-auto" width={150} height={48} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              Iluminación LED, accesorios y seguridad vehicular. Envíos a todo el país por Andreani.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="size-4 text-brand" /> Envíos por Andreani
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-brand" /> Garantía real
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="size-4 text-brand" /> 10% OFF por transferencia
              </span>
            </div>
          </div>

          {/* Categorías */}
          <nav>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">Categorías</h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => goCat(c.id)}
                    className="text-sm text-white/60 transition hover:text-brand"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* MercadoLibre: opción segura */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              ¿Preferís MercadoLibre?
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/45">
              Todo nuestro catálogo también está disponible en nuestra tienda de MercadoLibre,
              con compra protegida para quien prefiera ese canal.
            </p>
            <a
              href={STORE.mercadolibre}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#fff01f] px-5 py-3 text-sm font-bold text-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,240,31,0.3)]"
            >
              Comprar en MercadoLibre
            </a>
            <p className="mt-6 text-sm text-white/60">
              <span className="font-semibold text-white">AutosMix</span>
              <br />
              {STORE.address}
            </p>
          </div>
        </div>

        {/* Legales */}
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-white/35 sm:flex-row sm:px-6">
            <p>
              © {new Date().getFullYear()} AutosMix · Todos los derechos reservados
            </p>
            <p>
              Hecho con 🔴 en Mar del Plata
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
