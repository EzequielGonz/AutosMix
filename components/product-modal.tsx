'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useStore } from '@/components/store-context'
import { ProductDetail } from '@/components/product-detail'

/**
 * Popup de producto. Se abre al hacer clic en la tarjeta (la URL pasa a
 * /producto/[id] para poder compartirla) y se cierra con la X, el fondo,
 * Escape o el botón "atrás" del navegador.
 */
export function ProductModal() {
  const { modalProduct, closeModal } = useStore()

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

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-label={modalProduct.name}
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

        {/* key: al pasar de un producto a otro se reinicia el estado de la ficha */}
        <ProductDetail key={modalProduct.id} product={modalProduct} />
      </div>
    </div>
  )
}
