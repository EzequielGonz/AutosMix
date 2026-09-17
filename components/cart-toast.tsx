'use client'

import { Check, ShoppingBag } from 'lucide-react'
import { useStore } from '@/components/store-context'
import { cn } from '@/lib/utils'

export function CartToast() {
  const { lastAdded, openCart } = useStore()

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 z-[95] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 transition-all duration-500 sm:left-6 sm:translate-x-0',
        lastAdded ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-8 opacity-0',
      )}
    >
      {lastAdded && (
        <button
          onClick={openCart}
          className="group flex w-full items-center gap-3 rounded-2xl border border-brand/40 bg-panel/95 p-3 text-left shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Check className="size-6" />
          </div>
          {lastAdded.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lastAdded.image}
              alt=""
              className="size-12 shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-emerald-400">Producto agregado</p>
            <p className="truncate text-sm text-white/80">{lastAdded.name}</p>
          </div>
          <ShoppingBag className="size-5 shrink-0 text-white/40 transition group-hover:text-brand" />
        </button>
      )}
    </div>
  )
}
