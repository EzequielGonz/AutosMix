import { NextResponse } from 'next/server'
import { PRODUCTS } from '@/lib/products'
import { andreaniQuoteEnabled, quote, type CartLine } from '@/lib/andreani'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Indica si la cotización online está configurada. */
export async function GET() {
  return NextResponse.json({ enabled: andreaniQuoteEnabled() })
}

/** Cotiza el envío con Andreani. Body: { cp: "7600", items: [{ id, qty }] } */
export async function POST(req: Request) {
  if (!andreaniQuoteEnabled()) return NextResponse.json({ enabled: false })

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
