import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { loadProducts, saveProducts, sanitizeProduct } from '@/lib/admin-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ products: await loadProducts() })
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { product?: unknown } | null
  if (!body?.product) return NextResponse.json({ error: 'Falta el producto' }, { status: 400 })

  const products = await loadProducts()
  const product = sanitizeProduct(body.product, new Set(products.map((p) => p.id)))
  if (!product) return NextResponse.json({ error: 'Datos del producto inválidos' }, { status: 400 })

  if (products.some((p) => p.id === product.id)) {
    return NextResponse.json({ error: `Ya existe un producto con id "${product.id}"` }, { status: 409 })
  }

  const next = [product, ...products]
  const result = await saveProducts(next, `Admin: alta de producto "${product.name}"`)
  return NextResponse.json(
    result.ok ? { ok: true, mode: result.mode, deployed: result.deployed, products: next } : { error: result.error },
    { status: result.ok ? 200 : 500 },
  )
}

export async function PUT(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { id?: string; product?: unknown } | null
  if (!body?.id || !body?.product) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const products = await loadProducts()
  const idx = products.findIndex((p) => p.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const product = sanitizeProduct(body.product, new Set(products.map((p) => p.id)))
  if (!product) return NextResponse.json({ error: 'Datos del producto inválidos' }, { status: 400 })

  // Si cambió el id, validar que el nuevo no colisione.
  if (product.id !== body.id && products.some((p) => p.id === product.id)) {
    return NextResponse.json({ error: `Ya existe un producto con id "${product.id}"` }, { status: 409 })
  }

  const next = [...products]
  next[idx] = product
  const result = await saveProducts(next, `Admin: edición de producto "${product.name}"`)
  return NextResponse.json(
    result.ok ? { ok: true, mode: result.mode, deployed: result.deployed, products: next } : { error: result.error },
    { status: result.ok ? 200 : 500 },
  )
}

export async function DELETE(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const products = await loadProducts()
  const target = products.find((p) => p.id === id)
  if (!target) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const next = products.filter((p) => p.id !== id)
  const result = await saveProducts(next, `Admin: baja de producto "${target.name}"`)
  return NextResponse.json(
    result.ok ? { ok: true, mode: result.mode, deployed: result.deployed, products: next } : { error: result.error },
    { status: result.ok ? 200 : 500 },
  )
}
