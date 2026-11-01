'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, Zap } from 'lucide-react'
import { STORE } from '@/lib/products'
import { LAST_ORDER_KEY } from '@/components/checkout-form'
import type { Estado } from './page'

const COPY = {
  exito: {
    Icon: CheckCircle2,
    color: 'text-emerald-400',
    title: '¡Pago recibido!',
    text: 'Gracias por tu compra. Mandanos el detalle por WhatsApp y te confirmamos el despacho.',
  },
  pendiente: {
    Icon: Clock,
    color: 'text-amber-400',
    title: 'Pago pendiente',
    text: 'Mercado Pago está procesando tu pago. Apenas se acredite te confirmamos el pedido.',
  },
  error: {
    Icon: XCircle,
    color: 'text-brand',
    title: 'No se pudo completar el pago',
    text: 'No se realizó ningún cobro. Podés volver al carrito e intentar de nuevo o pedirnos por WhatsApp.',
  },
} as const

export function PaymentResult({ estado }: { estado: Estado }) {
  const { Icon, color, title, text } = COPY[estado]
  const [wa, setWa] = useState<string | null>(null)

  useEffect(() => {
    if (estado === 'error') return
    try {
      const order = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || 'null') as { ref?: string; text?: string } | null
      if (order?.text) {
        const head = `Ya pagué por Mercado Pago${estado === 'pendiente' ? ' (pago pendiente de acreditación)' : ''}. Ref. ${order.ref}\n\n`
        setWa(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(head + order.text)}`)
      }
      if (estado === 'exito') {
        localStorage.removeItem('autosmix-cart')
        localStorage.removeItem(LAST_ORDER_KEY)
      }
    } catch {
      /* sin storage */
    }
  }, [estado])

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <Icon className={`size-16 ${color}`} />
      <h1 className="font-display text-2xl uppercase">{title}</h1>
      <p className="text-sm text-white/60">{text}</p>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold uppercase tracking-wide text-white transition hover:bg-brand-600"
        >
          <Zap className="size-4" />
          Enviar detalle por WhatsApp
        </a>
      )}
      <Link href="/" className="text-xs text-white/50 underline hover:text-white">
        Volver a la tienda
      </Link>
    </main>
  )
}
