'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin, Store, Truck } from 'lucide-react'
import { formatPrice, STORE } from '@/lib/products'
import type { CartItem } from '@/components/store-context'
import { cn } from '@/lib/utils'

export type ShippingChoice =
  | { kind: 'coordinar' }
  | { kind: 'retiro' }
  | { kind: 'domicilio' | 'sucursal'; cp: string; cost: number; branch?: string }

type Branch = { id: string; nombre: string; direccion: string; horario?: string }
type QuoteResult = { cp: string; domicilio: number | null; sucursal: number | null; sucursales: Branch[] }

const CP_KEY = 'autosmix-cp'

/** Cotizador de envío Andreani por código postal dentro del carrito. */
export function ShippingQuote({
  items,
  value,
  onChange,
}: {
  items: CartItem[]
  value: ShippingChoice
  onChange: (c: ShippingChoice) => void
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [cp, setCp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<QuoteResult | null>(null)

  useEffect(() => {
    fetch('/api/shipping/quote')
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false))
    try {
      setCp(localStorage.getItem(CP_KEY) || '')
    } catch {
      /* sin storage */
    }
  }, [])

  // Si cambia el carrito, la cotización anterior ya no vale.
  const signature = items.map((i) => `${i.product.id}:${i.qty}`).join(',')
  useEffect(() => {
    setResult(null)
    setError('')
    if (value.kind === 'domicilio' || value.kind === 'sucursal') onChange({ kind: 'coordinar' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const cotizar = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = cp.replace(/\D/g, '')
    if (clean.length !== 4) {
      setError('Ingresá un código postal de 4 dígitos')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      localStorage.setItem(CP_KEY, clean)
    } catch {
      /* sin storage */
    }
    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cp: clean, items: items.map((i) => ({ id: i.product.id, qty: i.qty })) }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.enabled === false) {
        setEnabled(false)
      } else if (!res.ok || data.error) {
        setError(data.error || 'No pudimos cotizar el envío')
      } else {
        setResult(data)
        if (data.domicilio) onChange({ kind: 'domicilio', cp: clean, cost: data.domicilio })
        else if (data.sucursal) onChange({ kind: 'sucursal', cp: clean, cost: data.sucursal, branch: data.sucursales?.[0]?.nombre })
      }
    } catch {
      setError('Sin conexión. Probá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const option = (active: boolean, onClick: () => void, icon: React.ReactNode, label: React.ReactNode, price: string) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition',
        active ? 'border-brand bg-brand/10 text-white' : 'border-line text-white/60 hover:border-white/30',
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <span className="font-semibold">{price}</span>
    </button>
  )

  if (enabled === false) {
    return (
      <div className="mt-2 space-y-1.5">
        {option(value.kind !== 'retiro', () => onChange({ kind: 'coordinar' }), <Truck className="size-3.5 text-brand" />, 'Envío por Andreani · se coordina al confirmar', '—')}
        {option(value.kind === 'retiro', () => onChange({ kind: 'retiro' }), <Store className="size-3.5 text-brand" />, `Retiro en ${STORE.address}`, 'Gratis')}
      </div>
    )
  }

  return (
    <div className="mt-2">
      <form onSubmit={cotizar} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={cp}
            onChange={(e) => setCp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="Tu código postal"
            aria-label="Código postal"
            className="h-9 w-full rounded-lg border border-line bg-ink pl-8 pr-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-brand"
          />
        </div>
        <button
          type="submit"
          disabled={loading || enabled === null}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-brand/60 px-3 text-xs font-semibold text-white transition hover:bg-brand/15 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Truck className="size-3.5" />}
          Calcular envío
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs text-brand">{error}</p>}

      <div className="mt-2 space-y-1.5">
        {result?.domicilio != null &&
          option(
            value.kind === 'domicilio',
            () => onChange({ kind: 'domicilio', cp: result.cp, cost: result.domicilio! }),
            <Truck className="size-3.5 text-brand" />,
            'Andreani a domicilio',
            formatPrice(result.domicilio),
          )}
        {result?.sucursal != null &&
          option(
            value.kind === 'sucursal',
            () => onChange({ kind: 'sucursal', cp: result.cp, cost: result.sucursal!, branch: result.sucursales[0]?.nombre }),
            <MapPin className="size-3.5 text-brand" />,
            <>
              Retiro en sucursal Andreani
              {result.sucursales[0] && (
                <span className="block text-[10px] text-white/40">
                  {result.sucursales[0].nombre} · {result.sucursales[0].direccion}
                </span>
              )}
            </>,
            formatPrice(result.sucursal),
          )}
        {option(value.kind === 'retiro', () => onChange({ kind: 'retiro' }), <Store className="size-3.5 text-brand" />, `Retiro en ${STORE.address}`, 'Gratis')}
      </div>
    </div>
  )
}

export const shippingCost = (c: ShippingChoice) => (c.kind === 'domicilio' || c.kind === 'sucursal' ? c.cost : 0)

export function shippingLine(c: ShippingChoice): string {
  switch (c.kind) {
    case 'domicilio':
      return `Envío Andreani a domicilio (CP ${c.cp}): ${formatPrice(c.cost)}`
    case 'sucursal':
      return `Envío Andreani a sucursal${c.branch ? ` ${c.branch}` : ''} (CP ${c.cp}): ${formatPrice(c.cost)}`
    case 'retiro':
      return `Retiro en el local (${STORE.address})`
    default:
      return 'Envío por Andreani a coordinar.'
  }
}
