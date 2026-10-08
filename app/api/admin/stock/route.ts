import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { StoreError, updateCatalog } from '@/lib/admin-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Registra una venta: descuenta stock de varios productos en un solo commit.
 * Body: { items: [{ id, qty }] }
 */
export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { items?: { id?: string; qty?: number }[] } | null
  const items = (body?.items || [])
    .map((i) => ({ id: String(i?.id || ''), qty: Math.round(Number(i?.qty)) }))
    .filter((i) => i.id && i.qty >= 1 && i.qty <= 999)
  if (!items.length) return NextResponse.json({ error: 'No hay productos para descontar' }, { status: 400 })

  const result = await updateCatalog((products) => {
    const next = products.map((p) => ({ ...p }))
    for (const it of items) {
      const p = next.find((x) => x.id === it.id)
      if (!p) throw new StoreError(`Un producto del pedido ya no existe (${it.id}). Recargá la lista.`, 404)
      p.stock = Math.max(0, p.stock - it.qty)
    }
    return { products: next }
  }, `Admin: venta registrada (${items.reduce((a, i) => a + i.qty, 0)} unidades)`)

  return NextResponse.json(
    result.ok ? { ok: true, deployed: result.deployed, products: result.products } : { error: result.error },
    { status: result.ok ? 200 : result.status || 500 },
  )
}
