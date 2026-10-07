'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Zap } from 'lucide-react'
import { formatPrice, STORE, transferPrice } from '@/lib/products'
import type { CartItem } from '@/components/store-context'
import { shippingCost, shippingLine, type ShippingChoice } from '@/components/shipping-quote'
import { buildOrderMessage, EMPTY_CUSTOMER, validateCustomer, type Customer } from '@/lib/order-message'

const STORAGE_KEY = 'autosmix-customer'

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

  // Recordar los datos para la próxima compra.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved && typeof saved === 'object') setC({ ...EMPTY_CUSTOMER, ...saved })
    } catch {
      /* sin storage */
    }
  }, [])

  const needsAddress = shipping.kind === 'domicilio'
  const sendsAndreani = shipping.kind === 'domicilio' || shipping.kind === 'sucursal'
  const cost = shippingCost(shipping)
  const askBranch = shipping.kind === 'sucursal' && !shipping.branch

  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setC({ ...c, [k]: e.target.value })
    setError('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateCustomer(c, { needsAddress, needsId: sendsAndreani })
    if (err) {
      setError(err)
      return
    }
    if (askBranch && branchPref.trim().length < 3) {
      setError('Indicá en qué sucursal Andreani querés retirar')
      return
    }
    setError('')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    } catch {
      /* sin storage */
    }
    const text = buildOrderMessage({
      lines: items.map((i) => ({ qty: i.qty, name: i.product.name, subtotal: i.qty * i.product.price })),
      subtotal: total,
      shippingCost: cost,
      shippingText: shippingLine(shipping),
      needsAddress,
      branch: shipping.kind === 'sucursal' ? shipping.branch || branchPref.trim() : undefined,
      cp: sendsAndreani ? shipping.cp : undefined,
      customer: c,
    })
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
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

      <label className="block text-xs text-white/60">
        Nombre y apellido *
        <input value={c.nombre} onChange={set('nombre')} autoComplete="name" className={field} />
      </label>
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
        Email (te llegan los avisos de Andreani)
        <input value={c.email} onChange={set('email')} type="email" autoComplete="email" className={field} />
      </label>

      {needsAddress && (
        <>
          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <label className="block text-xs text-white/60">
              Calle *
              <input value={c.calle} onChange={set('calle')} autoComplete="address-line1" className={field} />
            </label>
            <label className="block text-xs text-white/60">
              Número *
              <input value={c.numero} onChange={set('numero')} className={field} />
            </label>
          </div>
          <label className="block text-xs text-white/60">
            Piso / depto / referencias
            <input value={c.piso} onChange={set('piso')} autoComplete="address-line2" className={field} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-white/60">
              Localidad *
              <input value={c.localidad} onChange={set('localidad')} autoComplete="address-level2" className={field} />
            </label>
            <label className="block text-xs text-white/60">
              Provincia *
              <input value={c.provincia} onChange={set('provincia')} autoComplete="address-level1" className={field} />
            </label>
          </div>
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

      <button
        type="submit"
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_25px_rgba(225,6,0,0.4)] transition hover:bg-brand-600 active:scale-[0.98]"
      >
        <Zap className="size-4" />
        Enviar pedido por WhatsApp
      </button>
      <p className="text-center text-[11px] text-white/35">
        Te respondemos para confirmar stock y pasarte los datos de pago.
      </p>
    </form>
  )
}
