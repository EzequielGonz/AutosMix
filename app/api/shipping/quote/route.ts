import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'
import { andreaniQuoteEnabled, branchesFor, quote, type CartLine } from '@/lib/andreani'
import { ratesConfigured, SHIPPING_RATES, zoneFor } from '@/lib/shipping-rates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const enabled = () => andreaniQuoteEnabled() || ratesConfigured(SHIPPING_RATES)

/** Indica si hay cotización (API de Andreani o tabla de tarifas del admin). */
export async function GET() {
  return NextResponse.json({ enabled: enabled() })
}

/**
 * Cotiza el envío. Body: { cp: "7600", items: [{ id, qty }] }
 * Con credenciales de Andreani usa su API; si no, la tabla de tarifas por
 * zona que se carga en /admin → Envíos.
 */
export async function POST(req: Request) {
  if (!enabled()) return NextResponse.json({ enabled: false })

  const body = (await req.json().catch(() => null)) as { cp?: string; items?: { id: string; qty: number }[] } | null
  const cp = String(body?.cp || '').replace(/\D/g, '')
  if (cp.length !== 4) return NextResponse.json({ error: 'Ingresá un código postal de 4 dígitos' }, { status: 400 })

  // Peso/medidas/precio salen del catálogo del servidor, no del cliente.
  const lines: CartLine[] = []
  for (const it of body?.items || []) {
    const product = PRODUCTS.find((p) => p.id === it.id)
    const qty = Math.min(99, Math.max(1, Math.round(Number(it.qty) || 1)))
    if (product) lines.push({ product, qty })
  }
  if (!lines.length) return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })

  if (!andreaniQuoteEnabled()) {
    const zone = zoneFor(SHIPPING_RATES, cp)
    if (!zone || (zone.domicilio === null && zone.sucursal === null)) {
      return NextResponse.json(
        { enabled: true, error: 'Para tu zona coordinamos el envío por WhatsApp al confirmar.' },
        { status: 422 },
      )
    }
    const subtotal = lines.reduce((acc, l) => acc + l.product.price * l.qty, 0)
    const free = SHIPPING_RATES.freeFrom !== null && subtotal >= SHIPPING_RATES.freeFrom
    const cost = (v: number | null) => (v === null ? null : free ? 0 : v)
    return NextResponse.json({
      enabled: true,
      cp,
      zona: zone.label,
      domicilio: cost(zone.domicilio),
      sucursal: cost(zone.sucursal),
      sucursales: zone.sucursal !== null ? await branchesFor(cp) : [],
    })
  }

  try {
    const q = await quote(cp, lines)
    if (q.domicilio === null && q.sucursal === null) {
      return NextResponse.json(
        { enabled: true, error: 'Andreani no pudo cotizar ese código postal. Lo coordinamos por WhatsApp.' },
        { status: 422 },
      )
    }
    return NextResponse.json({ enabled: true, cp, ...q })
  } catch {
    return NextResponse.json({ enabled: true, error: 'No pudimos cotizar ahora. Probá de nuevo en un rato.' }, { status: 502 })
  }
}
