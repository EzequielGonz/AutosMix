'use client'

import { useEffect } from 'react'
import { Minus, Plus, ShoppingCart, Trash2, X, Zap, ExternalLink, Truck, CreditCard } from 'lucide-react'
import { formatPrice, STORE } from '@/lib/products'
import { useStore } from '@/components/store-context'
import { cn } from '@/lib/utils'

export function CartDrawer() {
  const { items, isCartOpen, closeCart, remove, setQty, total, count, clear } = useStore()

  // Bloquear scroll y cerrar con Escape
  useEffect(() => {
    if (!isCartOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isCartOpen, closeCart])

  const whatsappMessage = () => {
    const lines = items.map(
      (i) => `• ${i.qty}x ${i.product.name} — ${formatPrice(i.qty * i.product.price)}`,
    )
    return encodeURIComponent(
      `¡Hola AutosMix! Quiero hacer un pedido:\n\n${lines.join('\n')}\n\nTotal: ${formatPrice(total)}\nEnvío por Andreani a coordinar.\n\nMi nombre: `,
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={cn(
          'fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm transition-opacity duration-400',
          isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-[100] flex h-dvh w-full max-w-md flex-col border-l border-line bg-ink shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isCartOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg uppercase">
            <ShoppingCart className="size-5 text-brand" />
            Tu carrito
            {count > 0 && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold">{count}</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="flex size-9 items-center justify-center rounded-full border border-line text-white/60 transition hover:border-brand/60 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-brand/10">
                <ShoppingCart className="size-9 text-brand/70" />
              </div>
              <div>
                <p className="font-display uppercase">Carrito vacío</p>
                <p className="mt-1 text-sm text-white/45">
                  Explorá el catálogo y sumá tus productos favoritos.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:bg-brand-600"
              >
                Ir a comprar
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="group flex gap-3 rounded-2xl border border-line bg-panel p-3 transition hover:border-brand/40"
                >
                  {/* Miniatura */}
                  <div className="size-18 shrink-0 overflow-hidden rounded-xl bg-black">
                    {item.product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-widest text-white/30">
                        Consultar
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-white/85">
                      {item.product.name}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-brand">
                      {item.product.brand}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      {/* Cantidad */}
                      <div className="flex items-center gap-1 rounded-full border border-line bg-ink px-1 py-0.5">
                        <button
                          onClick={() => setQty(item.product.id, item.qty - 1)}
                          aria-label="Quitar uno"
                          className="flex size-6 items-center justify-center rounded-full text-white/60 transition hover:bg-brand hover:text-white"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.product.id, item.qty + 1)}
                          aria-label="Sumar uno"
                          className="flex size-6 items-center justify-center rounded-full text-white/60 transition hover:bg-brand hover:text-white"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {formatPrice(item.qty * item.product.price)}
                        </span>
                        <button
                          onClick={() => remove(item.product.id)}
                          aria-label="Eliminar del carrito"
                          className="text-white/30 transition hover:text-brand"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer con checkout */}
        {items.length > 0 && (
          <div className="border-t border-line bg-panel/60 px-5 py-4 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/45">
              <CreditCard className="size-3.5 shrink-0 text-emerald-400" />
              <span>
                <span className="font-semibold text-emerald-400">10% OFF</span> pagando por
                transferencia
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
              <Truck className="size-3.5 shrink-0 text-brand" />
              <span>Envío a todo el país por Andreani · se coordina al confirmar</span>
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <span className="font-display uppercase">Total</span>
              <span className="font-display text-2xl text-brand">{formatPrice(total)}</span>
            </div>

            {/* Checkout WhatsApp */}
            <a
              href={`https://wa.me/${STORE.whatsapp}?text=${whatsappMessage()}`}
              target="_blank"
              rel="noreferrer"
              className="group relative mt-4 flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_25px_rgba(225,6,0,0.4)] transition-all duration-300 hover:bg-brand-600 active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Zap className="size-4" />
              Finalizar por WhatsApp
            </a>

            {/* MercadoLibre */}
            <a
              href={STORE.mercadolibre}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#fff01f]/50 bg-transparent text-sm font-semibold text-[#fff01f] transition-all duration-300 hover:bg-[#fff01f]/10"
            >
              <ExternalLink className="size-4" />
              Comprar en MercadoLibre
            </a>

            <button
              onClick={clear}
              className="mt-3 w-full text-center text-xs text-white/35 transition hover:text-brand"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
