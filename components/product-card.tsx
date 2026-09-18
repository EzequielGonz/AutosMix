'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingCart, Star } from 'lucide-react'
import { formatPrice, type Product } from '@/lib/products'
import { useStore } from '@/components/store-context'
import { cn } from '@/lib/utils'

const BADGE_STYLES: Record<string, string> = {
  'MÁS VENDIDO': 'bg-brand text-white',
  OFERTA: 'bg-white text-black',
  NUEVO: 'bg-emerald-500 text-white',
  PREMIUM: 'bg-gradient-to-r from-brand to-[#ff6b3d] text-white',
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add, openProduct } = useStore()
  const [added, setAdded] = useState(false)
  const [imgOk, setImgOk] = useState(true)

  // Resetear el check del botón después de un momento
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1400)
    return () => clearTimeout(t)
  }, [added])

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0

  const handleAdd = () => {
    add(product)
    setAdded(true)
  }

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-all duration-500 hover:-translate-y-1.5 hover:border-brand/50 hover:shadow-[0_20px_50px_-15px_rgba(225,6,0,0.35)]"
      style={{ animation: `fade-up 0.7s cubic-bezier(0.16,1,0.3,1) ${Math.min(index, 12) * 60}ms both` }}
    >
      {/* Imagen (clic abre el popup de detalle) */}
      <button
        type="button"
        onClick={() => openProduct(product)}
        aria-label={`Ver detalle de ${product.name}`}
        className="relative block aspect-[4/3] w-full cursor-pointer overflow-hidden bg-[#0a0a0a]"
      >
        {product.image && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-panel-2 to-black">
            <div className="size-12 rounded-full bg-brand/15 p-3">
              <Star className="size-full text-brand" />
            </div>
            <span className="px-6 text-center text-[11px] uppercase tracking-widest text-white/40">
              Consultar por WhatsApp
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.badge && (
            <span
              className={cn(
                'rounded-md px-2 py-1 text-[10px] font-bold tracking-wider uppercase shadow-lg',
                BADGE_STYLES[product.badge],
              )}
            >
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="w-fit rounded-md bg-white px-2 py-1 text-[10px] font-bold text-black">
              -{discount}%
            </span>
          )}
        </div>

        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">
          {product.brand}
        </p>
        <h3
          onClick={() => openProduct(product)}
          className="line-clamp-2 min-h-10 cursor-pointer text-sm font-semibold leading-snug text-white/90 transition-colors hover:text-brand"
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'size-3',
                  i < Math.round(product.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-white/10 text-white/10',
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-white/40">({product.reviews})</span>
        </div>

        {/* Precios */}
        <div className="mt-auto pt-2">
          {product.oldPrice && (
            <p className="text-xs text-white/35 line-through">{formatPrice(product.oldPrice)}</p>
          )}
          <p className="font-display text-xl text-white">{formatPrice(product.price)}</p>
          <p className="text-[11px] font-semibold text-emerald-400/90">
            10% OFF por transferencia
          </p>
        </div>

        {/* Botón comprar */}
        <button
          onClick={handleAdd}
          className={cn(
            'relative mt-3 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-300 active:scale-[0.97]',
            added
              ? 'bg-emerald-500 text-white'
              : 'bg-brand text-white shadow-[0_6px_20px_rgba(225,6,0,0.3)] hover:bg-brand-600 hover:shadow-[0_8px_28px_rgba(225,6,0,0.5)]',
          )}
        >
          {added ? (
            <>
              <Check className="size-4" /> Agregado
            </>
          ) : (
            <>
              <ShoppingCart className="size-4 transition-transform duration-300 group-hover:scale-110" />
              Agregar
            </>
          )}
        </button>
      </div>
    </article>
  )
}
