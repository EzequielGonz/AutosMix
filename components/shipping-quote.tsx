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
const branchLabel = (b?: Branch) => (b ? `${b.nombre} (${b.direccion})` : undefined)

type QuoteResult = { cp: string; zona?: string; domicilio: number | null; sucursal: number | null; sucursales: Branch[] }

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
        if (data.domicilio != null) onChange({ kind: 'domicilio', cp: clean, cost: data.domicilio })
        else if (data.sucursal != null) onChange({ kind: 'sucursal', cp: clean, cost: data.sucursal, branch: branchLabel(data.sucursales?.[0]) })
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
      {result?.zona && <p className="mt-1.5 text-[10px] text-white/40">Zona: {result.zona} · precio estimado</p>}

      <div className="mt-2 space-y-1.5">
        {result?.domicilio != null &&
          option(
            value.kind === 'domicilio',
            () => onChange({ kind: 'domicilio', cp: result.cp, cost: result.domicilio! }),
            <Truck className="size-3.5 text-brand" />,
            'Andreani a domicilio',
            money(result.domicilio),
          )}
        {result?.sucursal != null &&
          option(
            value.kind === 'sucursal',
            () =>
              value.kind !== 'sucursal' &&
              onChange({ kind: 'sucursal', cp: result.cp, cost: result.sucursal!, branch: branchLabel(result.sucursales[0]) }),
            <MapPin className="size-3.5 text-brand" />,
            <>
              Retiro en sucursal Andreani
              {value.kind !== 'sucursal' && result.sucursales[0] && (
                <span className="block text-[10px] text-white/40">
                  {result.sucursales[0].nombre} · {result.sucursales[0].direccion}
                </span>
              )}
            </>,
            money(result.sucursal),
          )}
        {value.kind === 'sucursal' && result && result.sucursales.length > 0 && (
          <div className="space-y-1 rounded-lg border border-line bg-ink/60 p-2" role="radiogroup" aria-label="Sucursal Andreani">
            <p className="px-1 text-[10px] uppercase tracking-widest text-white/40">Elegí la sucursal</p>
            {result.sucursales.map((b) => {
              const label = branchLabel(b)!
              const active = value.branch === label
              return (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ ...value, branch: label })}
                  className={cn(
                    'block w-full rounded-md px-2 py-1.5 text-left text-[11px] transition',
                    active ? 'bg-brand/15 text-white' : 'text-white/55 hover:bg-white/5',
                  )}
                >
                  <span className="font-semibold">{b.nombre}</span>
                  <span className="block text-[10px] text-white/40">
                    {b.direccion}
                    {b.horario ? ` · ${b.horario}` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        {option(value.kind === 'retiro', () => onChange({ kind: 'retiro' }), <Store className="size-3.5 text-brand" />, `Retiro en ${STORE.address}`, 'Gratis')}
      </div>
    </div>
  )
}

const money = (v: number) => (v === 0 ? 'Gratis' : formatPrice(v))

export const shippingCost = (c: ShippingChoice) => (c.kind === 'domicilio' || c.kind === 'sucursal' ? c.cost : 0)

export function shippingLine(c: ShippingChoice): string {
  switch (c.kind) {
    case 'domicilio':
      return `Envío Andreani a domicilio (CP ${c.cp}): ${money(c.cost)}`
    case 'sucursal':
      return `Envío Andreani a sucursal (CP ${c.cp}): ${money(c.cost)}`
    case 'retiro':
      return `Retiro en el local (${STORE.address})`
    default:
      return 'Envío por Andreani a coordinar.'
  }
}
