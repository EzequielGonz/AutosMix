'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CreditCard, Loader2, Zap } from 'lucide-react'
import { formatPrice, STORE, transferPrice } from '@/lib/products'
import type { CartItem } from '@/components/store-context'
import { shippingCost, shippingLine, type ShippingChoice } from '@/components/shipping-quote'
import { buildOrderMessage, EMPTY_CUSTOMER, PROVINCIAS, validateCustomer, type Customer } from '@/lib/order-message'

const STORAGE_KEY = 'autosmix-customer'
/** Último pedido pagado con Mercado Pago, para mandarlo por WhatsApp al volver. */
export const LAST_ORDER_KEY = 'autosmix-last-order'

const field =
  'mt-1 h-10 w-full rounded-lg border border-line bg-ink px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-brand'

/**
 * Paso 2 del carrito: datos del cliente. Arma el mensaje de WhatsApp con todo
 * lo que hace falta para generar el envío en Andreani sin pedir nada más.
 */
export function CheckoutForm({
  items,
  total,
  shipping,
  onBack,
}: {
  items: CartItem[]
  total: number
  shipping: ShippingChoice
  onBack: () => void
}) {
  const [c, setC] = useState<Customer>(EMPTY_CUSTOMER)
  const [error, setError] = useState('')
  // Si Andreani no devolvió sucursales para el CP, el cliente escribe la que prefiere.
  const [branchPref, setBranchPref] = useState('')
  const [mpEnabled, setMpEnabled] = useState(false)
  const [paying, setPaying] = useState(false)

  // Recordar los datos para la próxima compra.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved && typeof saved === 'object') setC({ ...EMPTY_CUSTOMER, ...saved })
    } catch {
      /* sin storage */
    }
  }, [])

  useEffect(() => {
    fetch('/api/mercadopago/checkout')
      .then((r) => r.json())
      .then((d) => setMpEnabled(!!d.enabled))
      .catch(() => setMpEnabled(false))
  }, [])

  // "A coordinar" también es un envío por Andreani: se piden los mismos datos.
  const needsAddress = shipping.kind === 'domicilio' || shipping.kind === 'coordinar'
  const sendsAndreani = shipping.kind !== 'retiro'
  const cost = shippingCost(shipping)
  const askBranch = shipping.kind === 'sucursal' && !shipping.branch
  // El CP cotizado en el carrito manda: si cambia, cambia el precio del envío.
  const quotedCp = shipping.kind === 'domicilio' ? shipping.cp : ''
  const customer = quotedCp ? { ...c, cp: quotedCp } : c

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setC({ ...c, [k]: k === 'cp' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value })
    setError('')
  }

  /** Valida, recuerda los datos y arma el mensaje de pedido. Null si hay un error. */
  const prepare = () => {
    const err = validateCustomer(customer, { needsAddress, needsId: sendsAndreani })
    if (err) {
      setError(err)
      return null
    }
    if (askBranch && branchPref.trim().length < 3) {
      setError('Indicá en qué sucursal Andreani querés retirar')
      return null
    }
    setError('')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer))
    } catch {
      /* sin storage */
    }
    return buildOrderMessage({
      lines: items.map((i) => ({ qty: i.qty, name: i.product.name, subtotal: i.qty * i.product.price })),
      subtotal: total,
      shippingCost: cost,
      shippingText: shippingLine(shipping),
      needsAddress,
      branch: shipping.kind === 'sucursal' ? shipping.branch || branchPref.trim() : undefined,
      customer,
    })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = prepare()
    if (!text) return
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  const payWithMercadoPago = async () => {
    const text = prepare()
    if (!text) return
    setPaying(true)
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.product.id, qty: i.qty })),
          shipping: { kind: shipping.kind, cp: shipping.kind === 'domicilio' || shipping.kind === 'sucursal' ? shipping.cp : '' },
          customer,
        }),
      })
      const d = (await res.json().catch(() => ({}))) as { url?: string; ref?: string; error?: string }
      if (!res.ok || !d.url) {
        setError(d.error || 'No pudimos iniciar el pago. Probá de nuevo.')
        setPaying(false)
        return
      }
      try {
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ref: d.ref, text }))
      } catch {
        /* sin storage */
      }
      window.location.href = d.url
    } catch {
      setError('No pudimos conectar con Mercado Pago. Probá de nuevo.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 self-start text-xs text-white/50 hover:text-white">
        <ArrowLeft className="size-3.5" /> Volver al carrito
      </button>

      <div className="rounded-xl border border-line bg-panel p-3 text-xs text-white/60">
        <p className="font-semibold text-white">{shippingLine(shipping)}</p>
        <p className="mt-1">
          Total: <span className="font-semibold text-white">{formatPrice(total + cost)}</span> · por transferencia:{' '}
          <span className="font-semibold text-emerald-400">{formatPrice(transferPrice(total) + cost)}</span>
        </p>
      </div>

      <p className="text-xs text-white/45">
        {sendsAndreani
          ? 'Estos datos son los que pide Andreani para generar tu envío.'
          : 'Dejanos tus datos para coordinar la entrega.'}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-white/60">
          Nombre *
          <input value={c.nombre} onChange={set('nombre')} autoComplete="given-name" className={field} />
        </label>
        <label className="block text-xs text-white/60">
          Apellido *
          <input value={c.apellido} onChange={set('apellido')} autoComplete="family-name" className={field} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-white/60">
          Teléfono (con área) *
          <input value={c.telefono} onChange={set('telefono')} inputMode="tel" autoComplete="tel" placeholder="223 1234567" className={field} />
        </label>
        <label className="block text-xs text-white/60">
          DNI {sendsAndreani && '*'}
          <input value={c.dni} onChange={set('dni')} inputMode="numeric" className={field} />
        </label>
      </div>
      <label className="block text-xs text-white/60">
        Email {sendsAndreani && '*'} <span className="text-white/35">(te llegan los avisos de Andreani)</span>
        <input value={c.email} onChange={set('email')} type="email" autoComplete="email" className={field} />
      </label>

      {needsAddress && (
        <>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">Dirección de entrega</p>
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <label className="block text-xs text-white/60">
              Calle *
              <input value={c.calle} onChange={set('calle')} autoComplete="address-line1" className={field} />
            </label>
            <label className="block text-xs text-white/60">
              Número *
              <input value={c.numero} onChange={set('numero')} inputMode="numeric" className={field} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-white/60">
              Piso
              <input value={c.piso} onChange={set('piso')} className={field} />
            </label>
            <label className="block text-xs text-white/60">
              Depto
              <input value={c.depto} onChange={set('depto')} className={field} />
            </label>
          </div>
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <label className="block text-xs text-white/60">
              Ciudad / localidad *
              <input value={c.localidad} onChange={set('localidad')} autoComplete="address-level2" className={field} />
            </label>
            <label className="block text-xs text-white/60">
              Código postal *
              <input
                value={customer.cp}
                onChange={set('cp')}
                readOnly={!!quotedCp}
                inputMode="numeric"
                autoComplete="postal-code"
                title={quotedCp ? 'Es el CP con el que cotizaste el envío. Para cambiarlo, volvé al carrito.' : undefined}
                className={`${field} ${quotedCp ? 'opacity-60' : ''}`}
              />
            </label>
          </div>
          <label className="block text-xs text-white/60">
            Provincia *
            <select value={c.provincia} onChange={set('provincia')} autoComplete="address-level1" className={field}>
              <option value="">Elegí la provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-white/60">
            Entre calles / referencias
            <input
              value={c.referencias}
              onChange={set('referencias')}
              placeholder="Ej: entre Colón y Alem, portón negro"
              className={field}
            />
          </label>
        </>
      )}

      {askBranch && (
        <label className="block text-xs text-white/60">
          Sucursal Andreani donde querés retirar *
          <input
            value={branchPref}
            onChange={(e) => setBranchPref(e.target.value)}
            placeholder="Ej: Córdoba centro, Av. Colón"
            className={field}
          />
        </label>
      )}

      {error && <p className="text-xs text-brand">{error}</p>}

      {mpEnabled && (
        <button
          type="button"
          onClick={payWithMercadoPago}
          disabled={paying}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#009ee3] text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#0087c4] active:scale-[0.98] disabled:opacity-60"
        >
          {paying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
          Pagar con Mercado Pago
        </button>
      )}
      <button
        type="submit"
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_25px_rgba(225,6,0,0.4)] transition hover:bg-brand-600 active:scale-[0.98]"
      >
        <Zap className="size-4" />
        {mpEnabled ? 'Pedir por WhatsApp (pago a coordinar)' : 'Enviar pedido por WhatsApp'}
      </button>
      <p className="text-center text-[11px] text-white/35">
        Te respondemos para confirmar stock y pasarte los datos de pago.
      </p>
    </form>
  )
}
