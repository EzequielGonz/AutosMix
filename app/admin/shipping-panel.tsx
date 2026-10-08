'use client'

import { useEffect, useState } from 'react'
import { Check, Plus, RefreshCw, Trash2, Truck, X } from 'lucide-react'
import type { ShippingRates, ShippingZone } from '@/lib/shipping-rates'

const input =
  'mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand'

type Row = Omit<ShippingZone, 'domicilio' | 'sucursal'> & { domicilio: string; sucursal: string }

const toRow = (z: ShippingZone): Row => ({
  ...z,
  domicilio: z.domicilio == null ? '' : String(z.domicilio),
  sucursal: z.sucursal == null ? '' : String(z.sucursal),
})

/** Tarifas de envío por zona (se usan en el carrito si no hay API de Andreani). */
export function ShippingPanel({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [freeFrom, setFreeFrom] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' })

  useEffect(() => {
    fetch('/api/admin/shipping', { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'No pude cargar las tarifas')
        const rates = d.rates as ShippingRates
        setRows(rates.zones.map(toRow))
        setFreeFrom(rates.freeFrom == null ? '' : String(rates.freeFrom))
      })
      .catch((e) => setStatus({ kind: 'error', msg: e.message }))
  }, [])

  const set = (i: number, patch: Partial<Row>) => setRows((r) => r!.map((z, j) => (j === i ? { ...z, ...patch } : z)))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rows) return
    setStatus({ kind: 'busy', msg: 'Guardando…' })
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: { zones: rows, freeFrom } }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) throw new Error(d.error || `No pude guardar (${res.status})`)
      setRows((d.rates as ShippingRates).zones.map(toRow))
      setStatus({
        kind: 'ok',
        msg: d.deployed ? 'Tarifas guardadas · la tienda se actualiza en ~1 min' : 'Tarifas guardadas',
      })
    } catch (err) {
      setStatus({ kind: 'error', msg: err instanceof Error ? err.message : 'Sin conexión' })
    }
  }

  return (
    <form onSubmit={save} className="mb-6 rounded-2xl border border-line bg-panel p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Truck className="size-5 text-brand" /> Tarifas de envío
        </h2>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
          <X className="size-5" />
        </button>
      </div>
      <p className="mb-4 text-xs text-white/45">
        El cliente pone su código postal en el carrito y ve el precio de su zona. Copiá los precios que te
        muestra el portal de Andreani PyMEs para un paquete típico. Dejá un precio vacío para que esa zona
        diga &quot;a coordinar&quot;. La zona sin códigos postales se usa para todo lo demás.
      </p>

      {!rows ? (
        status.kind === 'error' ? null : <RefreshCw className="mx-auto size-5 animate-spin text-white/40" />
      ) : (
        <div className="space-y-3">
          {rows.map((z, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-line bg-black/20 p-3 sm:grid-cols-12">
              <label className="block text-xs text-white/50 sm:col-span-3">
                Zona
                <input value={z.label} onChange={(e) => set(i, { label: e.target.value })} className={input} />
              </label>
              <label className="block text-xs text-white/50 sm:col-span-4">
                Códigos postales (ej. 7600-7613, 7620)
                <input
                  value={z.ranges}
                  onChange={(e) => set(i, { ranges: e.target.value })}
                  placeholder="vacío = resto del país"
                  className={input}
                />
              </label>
              <label className="block text-xs text-white/50 sm:col-span-2">
                A domicilio ($)
                <input type="number" min="0" value={z.domicilio} onChange={(e) => set(i, { domicilio: e.target.value })} className={input} />
              </label>
              <label className="block text-xs text-white/50 sm:col-span-2">
                A sucursal ($)
                <input type="number" min="0" value={z.sucursal} onChange={(e) => set(i, { sucursal: e.target.value })} className={input} />
              </label>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  title="Quitar zona"
                  onClick={() => setRows((r) => r!.filter((_, j) => j !== i))}
                  className="rounded-lg p-2 text-white/50 hover:bg-brand/10 hover:text-brand"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((r) => [...r!, { id: `zona-${Date.now().toString(36)}`, label: '', ranges: '', domicilio: '', sucursal: '' }])}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <Plus className="size-3.5" /> Agregar zona
          </button>
          <label className="block max-w-xs text-xs text-white/50">
            Envío gratis desde ($ de compra, opcional)
            <input type="number" min="0" value={freeFrom} onChange={(e) => setFreeFrom(e.target.value)} className={input} />
          </label>
        </div>
      )}

      {status.kind !== 'idle' && status.msg && (
        <p
          className={`mt-4 flex items-center gap-1.5 text-sm ${
            status.kind === 'error' ? 'text-brand' : status.kind === 'ok' ? 'text-emerald-400' : 'text-white/60'
          }`}
        >
          {status.kind === 'busy' && <RefreshCw className="size-4 animate-spin" />}
          {status.kind === 'ok' && <Check className="size-4" />}
          {status.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={!rows || status.kind === 'busy'}
        className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold transition hover:bg-brand-600 disabled:opacity-50"
      >
        Guardar tarifas
      </button>
    </form>
  )
}
