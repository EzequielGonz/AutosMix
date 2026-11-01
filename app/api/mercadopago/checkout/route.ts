import { NextResponse } from 'next/server'
import { PRODUCTS, SITE_URL } from '@/lib/products'
import type { CartLine } from '@/lib/andreani'
import { serverShippingCost } from '@/lib/server-shipping'
import { validateCustomer, type Customer } from '@/lib/order-message'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const token = () => (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim()

/** Indica si Mercado Pago está configurado (el carrito muestra u oculta el botón). */
export async function GET() {
  return NextResponse.json({ enabled: !!token() })
}

type Body = {
  items?: { id: string; qty: number }[]
  shipping?: { kind?: string; cp?: string }
  customer?: Customer
}

/**
 * Crea la preferencia de Checkout Pro y devuelve el link de pago.
 * Precios y envío se recalculan acá con el catálogo del servidor.
 */
export async function POST(req: Request) {
  if (!token()) return NextResponse.json({ error: 'Mercado Pago no está configurado' }, { status: 503 })

  const body = (await req.json().catch(() => null)) as Body | null
  const customer = body?.customer
  const kind = body?.shipping?.kind
  if (!customer || (kind !== 'retiro' && kind !== 'domicilio' && kind !== 'sucursal' && kind !== 'coordinar')) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const lines: CartLine[] = []
  for (const it of body?.items || []) {
    const product = PRODUCTS.find((p) => p.id === it.id)
    const qty = Math.min(99, Math.max(1, Math.round(Number(it.qty) || 1)))
    if (!product) continue
    if (product.stock <= 0) return NextResponse.json({ error: `Sin stock: ${product.name}` }, { status: 409 })
    lines.push({ product, qty })
  }
  if (!lines.length) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })

  const needsAddress = kind === 'domicilio' || kind === 'coordinar'
  const err = validateCustomer(customer, { needsAddress, needsId: kind !== 'retiro' })
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  let shippingCost = 0
  if (kind === 'domicilio' || kind === 'sucursal') {
    const cp = String(body?.shipping?.cp || '').replace(/\D/g, '')
    const cost = cp.length === 4 ? await serverShippingCost(kind, cp, lines) : null
    if (cost === null) {
      return NextResponse.json({ error: 'No pudimos cotizar el envío. Probá de nuevo o pedí por WhatsApp.' }, { status: 422 })
    }
    shippingCost = cost
  }

  const ref = `AM-${Date.now().toString(36).toUpperCase()}`
  const https = SITE_URL.startsWith('https://')
  const phone = customer.telefono.replace(/\D/g, '')

  const preference = {
    items: lines.map((l) => ({
      id: l.product.id,
      title: l.product.name.slice(0, 250),
      quantity: l.qty,
      unit_price: l.product.price,
      currency_id: 'ARS',
    })),
    payer: {
      name: customer.nombre.trim(),
      surname: customer.apellido.trim(),
      email: customer.email.trim() || undefined,
      phone: { number: phone },
      identification: customer.dni.trim() ? { type: 'DNI', number: customer.dni.replace(/\D/g, '') } : undefined,
    },
    shipments: {
      mode: 'not_specified',
      cost: shippingCost,
      ...(needsAddress && {
        receiver_address: {
          zip_code: customer.cp.trim(),
          street_name: customer.calle.trim(),
          street_number: customer.numero.trim(),
          floor: customer.piso.trim() || undefined,
          apartment: customer.depto.trim() || undefined,
          city_name: customer.localidad.trim(),
          state_name: customer.provincia.trim(),
        },
      }),
    },
    external_reference: ref,
    statement_descriptor: 'AUTOSMIX',
    back_urls: {
      success: `${SITE_URL}/pago/exito`,
      pending: `${SITE_URL}/pago/pendiente`,
      failure: `${SITE_URL}/pago/error`,
    },
    // Mercado Pago exige https para volver solo al sitio.
    ...(https && { auto_return: 'approved' }),
  }

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
      cache: 'no-store',
    })
    const data = (await res.json().catch(() => ({}))) as { init_point?: string; sandbox_init_point?: string; message?: string }
    if (!res.ok || !data.init_point) {
      console.error('Mercado Pago rechazó la preferencia', res.status, data)
      return NextResponse.json({ error: 'Mercado Pago no pudo generar el pago. Probá de nuevo.' }, { status: 502 })
    }
    // Con credenciales de prueba (TEST-...) corresponde el link sandbox.
    const url = token().startsWith('TEST-') && data.sandbox_init_point ? data.sandbox_init_point : data.init_point
    return NextResponse.json({ url, ref })
  } catch {
    return NextResponse.json({ error: 'No pudimos conectar con Mercado Pago. Probá de nuevo.' }, { status: 502 })
  }
}
