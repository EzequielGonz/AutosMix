'use client'

import { useState } from 'react'
import { Check, ClipboardPaste, MessageCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import type { Product } from '@/lib/products'
import { parseOrderMessage, waPhone } from '@/lib/order-message'

const input =
  'w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

type Line = { key: number; name: string; qty: string; id: string }

/**
 * Registrar una venta: se pega el mensaje del pedido que llegó por WhatsApp,
 * se descuenta el stock y se le avisa al cliente el número de seguimiento.
 */
export function SalesPanel({
  products,
  onProducts,
  onClose,
}: {
  products: Product[]
  onProducts: (p: Product[]) => void
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [tracking, setTracking] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' })

  const byName = new Map(products.map((p) => [norm(p.name), p.id]))

  const read = () => {
    const parsed = parseOrderMessage(text)
    if (!parsed.lines.length) {
      setStatus({ kind: 'error', msg: 'No encontré productos en el mensaje. Copiá el pedido completo desde WhatsApp.' })
      return
    }
    setLines(
      parsed.lines.map((l, i) => ({ key: Date.now() + i, name: l.name, qty: String(l.qty), id: byName.get(norm(l.name)) || '' })),
    )
    if (parsed.nombre) setNombre(parsed.nombre)
    if (parsed.telefono) setTelefono(parsed.telefono)
    setStatus({ kind: 'idle' })
  }

  const setLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const discount = async () => {
    const items = lines.filter((l) => l.id).map((l) => ({ id: l.id, qty: Number(l.qty) }))
    if (lines.some((l) => !l.id)) {
      setStatus({ kind: 'error', msg: 'Hay productos sin identificar: elegilos de la lista o quitalos.' })
      return
    }
    if (!items.length || items.some((i) => !(i.qty >= 1))) {
      setStatus({ kind: 'error', msg: 'Revisá las cantidades.' })
      return
    }
    setStatus({ kind: 'busy', msg: 'Descontando stock…' })
    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.ok) throw new Error(d.error || `No pude descontar el stock (${res.status})`)
      onProducts(d.products)
      setLines([])
      setText('')
      setStatus({ kind: 'ok', msg: d.deployed ? 'Stock descontado · la tienda se actualiza en ~1 min' : 'Stock descontado' })
    } catch (e) {
      setStatus({ kind: 'error', msg: e instanceof Error ? e.message : 'Sin conexión' })
    }
  }

  const phone = waPhone(telefono)
  const trackingClean = tracking.replace(/\s/g, '')
  const notifyHref =
    phone && trackingClean
      ? `https://wa.me/${phone}?text=${encodeURIComponent(
          `¡Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}! Tu pedido de AutosMix ya salió 📦\n\n` +
            `Número de seguimiento Andreani: ${trackingClean}\n` +
            `Seguilo acá: ${window.location.origin}/seguimiento?numero=${encodeURIComponent(trackingClean)}\n\n` +
            `¡Gracias por tu compra!`,
        )}`
      : null

  return (
    <div className="mb-6 rounded-2xl border border-line bg-panel p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <ClipboardPaste className="size-5 text-brand" /> Registrar venta
        </h2>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white">
          <X className="size-5" />
        </button>
      </div>
      <p className="mb-4 text-xs text-white/45">
        Copiá el mensaje del pedido que te llegó por WhatsApp y pegalo acá. Se descuenta el stock de los productos y
        después le podés mandar el número de seguimiento al cliente.
      </p>

      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'¡Hola AutosMix! Quiero hacer un pedido:\n\n• 1x Kit Cree Led H4 — $25.000\n…'}
        className={`${input} font-mono text-xs`}
      />
      <button
        type="button"
        onClick={read}
        disabled={!text.trim()}
        className="mt-2 rounded-lg border border-line px-4 py-2 text-sm text-white/80 transition hover:text-white disabled:opacity-40"
      >
        Leer pedido
      </button>

      {lines.length > 0 && (
        <div className="mt-4 space-y-2">
          {lines.map((l) => {
            const p = products.find((x) => x.id === l.id)
            return (
              <div key={l.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-black/20 p-2">
                <div className="min-w-0 flex-1">
                  {p ? (
                    <p className="truncate text-sm">{p.name}</p>
                  ) : (
                    <select value={l.id} onChange={(e) => setLine(l.key, { id: e.target.value })} className={`${input} py-1.5`}>
                      <option value="">¿Qué producto es «{l.name || 'nuevo'}»?</option>
                      {products.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {p && (
                    <p className={`text-xs ${p.stock < Number(l.qty) ? 'text-brand' : 'text-white/40'}`}>
                      Stock actual: {p.stock} → quedan {Math.max(0, p.stock - (Number(l.qty) || 0))}
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  value={l.qty}
                  onChange={(e) => setLine(l.key, { qty: e.target.value })}
                  aria-label="Cantidad"
                  className={`${input} w-20 py-1.5`}
                />
                <button
                  type="button"
                  title="Quitar"
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                  className="rounded-lg p-2 text-white/50 hover:bg-brand/10 hover:text-brand"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLines((ls) => [...ls, { key: Date.now(), name: '', qty: '1', id: '' }])}
              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-white/60 hover:text-white"
            >
              <Plus className="size-3.5" /> Agregar producto
            </button>
            <button
              type="button"
              onClick={discount}
              disabled={status.kind === 'busy'}
              className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold transition hover:bg-brand-600 disabled:opacity-50"
            >
              Descontar stock
            </button>
          </div>
        </div>
      )}

      {status.kind !== 'idle' && status.msg && (
        <p
          className={`mt-3 flex items-center gap-1.5 text-sm ${
            status.kind === 'error' ? 'text-brand' : status.kind === 'ok' ? 'text-emerald-400' : 'text-white/60'
          }`}
        >
          {status.kind === 'busy' && <RefreshCw className="size-4 animate-spin" />}
          {status.kind === 'ok' && <Check className="size-4" />}
          {status.msg}
        </p>
      )}

      <div className="mt-6 border-t border-line pt-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="size-4 text-brand" /> Avisar despacho al cliente
        </h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del cliente" className={input} />
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono (223 1234567)" inputMode="tel" className={input} />
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="N.º de seguimiento Andreani" className={input} />
        </div>
        {telefono && !phone && (
          <p className="mt-1 text-xs text-brand">El teléfono tiene que tener código de área y número (10 dígitos).</p>
        )}
        {notifyHref ? (
          <a
            href={notifyHref}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <MessageCircle className="size-4" /> Enviar seguimiento por WhatsApp
          </a>
        ) : (
          <p className="mt-2 text-xs text-white/35">Completá teléfono y número de seguimiento para generar el mensaje.</p>
        )}
      </div>
    </div>
  )
}
