import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { loadDataFile, saveDataFile } from '@/lib/admin-store'
import { sanitizeRates, SHIPPING_RATES, type ShippingRates } from '@/lib/shipping-rates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    return NextResponse.json({ rates: await loadDataFile<ShippingRates>('shipping.json', SHIPPING_RATES) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { rates?: unknown } | null
  if (!body?.rates) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const rates = sanitizeRates(body.rates)
  const result = await saveDataFile('shipping.json', rates, 'Admin: tarifas de envío')
  return NextResponse.json(
    result.ok ? { ok: true, deployed: result.deployed, rates } : { error: result.error },
    { status: result.ok ? 200 : result.status || 500 },
  )
}
