'use client'

import { useEffect, useState } from 'react'
import { Check, Minus, Plus, ShieldCheck, ShoppingCart, Truck, X } from 'lucide-react'
import { STORE, formatPrice, transferPrice, type Product } from '@/lib/products'
import { useStore } from '@/components/store-context'
import { cn } from '@/lib/utils'

const BADGE_STYLES: Record<string, string> = {
  'MÁS VENDIDO': 'bg-brand text-white',
  OFERTA: 'bg-white text-black',
  NUEVO: 'bg-emerald-500 text-white',
  PREMIUM: 'bg-gradient-to-r from-brand to-[#ff6b3d] text-white',
}

const CATEGORY_LABELS: Record<string, string> = {
  iluminacion: 'Iluminación',
  accesorios: 'Accesorios',
  seguridad: 'Seguridad',
  estetica: 'Estética',
}

/**
 * Popup de producto estilo MercadoLibre: imagen grande a la izquierda,
 * información de compra a la derecha. Se abre al hacer clic en la tarjeta
 * y se cierra con la X, el fondo, o Escape.
 */
export function ProductModal() {
  const { modalProduct, closeModal, add } = useStore()
  const [added, setAdded] = useState(false)
  const [imgOk, setImgOk] = useState(true)

  // Cerrar con Escape y bloquear el scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!modalProduct) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeModal()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [modalProduct, closeModal])

  if (!modalProduct) return null
  const p = modalProduct

  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const out = p.stock <= 0

  const buyNow = () => {
    add(p)
    setAdded(true)
  }

  const waHref = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    `¡Hola AutosMix! Me interesa "${p.name}" (${formatPrice(p.price)}). ¿Está disponible?`,
  )}`

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-label={p.name}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.8)] animate-zoom-in sm:rounded-3xl"
      >
        {/* Cerrar */}
        <button
          onClick={closeModal}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/60 text-white/70 backdrop-blur transition hover:bg-brand hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Imagen */}
          <div className="relative flex min-h-64 items-center justify-center bg-white p-6 sm:min-h-80 md:p-10">
            {p.image && imgOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.image}
                alt={p.name}
                onError={() => setImgOk(false)}
                className="max-h-[46vh] w-auto max-w-full rounded-xl object-contain md:max-h-[56vh]"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="size-20 rounded-full bg-brand/10 p-5">
                  <ShieldCheck className="size-full text-brand" />
                </div>
                <span className="text-xs uppercase tracking-widest text-black/50">
                  Consultar por WhatsApp
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-1.5">
              {p.badge && (
                <span
                  className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg',
                    BADGE_STYLES[p.badge],
                  )}
                >
                  {p.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="w-fit rounded-md bg-black px-2 py-1 text-[10px] font-bold text-white">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          {/* Info de compra */}
          <div className="flex flex-col gap-4 p-5 sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">
                {p.brand}
              </p>
              <h2 className="mt-1.5 text-lg font-semibold leading-snug sm:text-xl">{p.name}</h2>
            </div>

            {/* Valoración */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className={cn('size-3.5', i < Math.round(p.rating) ? 'fill-amber-400' : 'fill-white/15')}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <span className="text-white/50">{p.rating.toFixed(1)} · {p.reviews} reseñas</span>
            </div>

            {/* Precios */}
            <div>
              {p.oldPrice && (
                <p className="text-sm text-white/35 line-through">{formatPrice(p.oldPrice)}</p>
              )}
              <p className="font-display text-3xl text-white sm:text-4xl">{formatPrice(p.price)}</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">
                10% OFF por transferencia · {formatPrice(transferPrice(p.price))}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                <Truck className="size-3.5 shrink-0" /> Envío a todo el país por Andreani
              </p>
            </div>

            {/* Stock */}
            <p className={cn('text-xs font-semibold', out ? 'text-brand' : 'text-emerald-400/90')}>
              {out ? 'Sin stock · consultanos por WhatsApp' : `Stock disponible: ${p.stock} unidades`}
            </p>

            {/* Acciones */}
            <div className="mt-auto flex flex-col gap-2.5">
              <button
                onClick={buyNow}
                disabled={out}
                className={cn(
                  'flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all active:scale-[0.98]',
                  added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-brand text-white shadow-[0_6px_20px_rgba(225,6,0,0.3)] hover:bg-brand-600',
                  out && 'cursor-not-allowed opacity-40',
                )}
              >
                {added ? (
                  <><Check className="size-4" /> Agregado al carrito</>
                ) : (
                  <><ShoppingCart className="size-4" /> Agregar al carrito</>
                )}
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#25D366]/60 bg-[#25D366]/10 text-sm font-bold uppercase tracking-wide text-[#25D366] transition hover:bg-[#25D366]/20"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="border-t border-line p-5 sm:p-7">
          <h3 className="font-display text-sm uppercase tracking-widest text-white/90">
            Descripción
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {p.description || 'Consultá por WhatsApp para más detalles sobre este producto.'}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <dt className="text-white/40">Marca</dt>
              <dd className="mt-0.5 font-semibold">{p.brand}</dd>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <dt className="text-white/40">Categoría</dt>
              <dd className="mt-0.5 font-semibold">{CATEGORY_LABELS[p.category] ?? p.category}</dd>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <dt className="text-white/40">Garantía</dt>
              <dd className="mt-0.5 font-semibold">Real · 6 meses</dd>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <dt className="text-white/40">Retiro</dt>
              <dd className="mt-0.5 font-semibold">Bordabehere 3111</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
