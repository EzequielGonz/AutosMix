import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  loadProducts,
  prepareImage,
  sanitizeProduct,
  StoreError,
  uniqueId,
  updateCatalog,
  type SaveResult,
} from '@/lib/admin-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const unauthorized = () => NextResponse.json({ error: 'No autorizado' }, { status: 401 })

/**
 * El body puede venir como JSON `{ id?, product }` o como multipart con los
 * campos `product` (JSON), `id` (al editar) y `file` (imagen opcional), para
 * guardar producto + foto en una sola operación.
 */
async function readBody(req: Request): Promise<{ id?: string; product?: Record<string, unknown>; file?: File }> {
  const type = req.headers.get('content-type') || ''
  if (type.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null)
    if (!form) throw new StoreError('Formulario inválido (¿la imagen es demasiado grande?)', 413)
    const raw = form.get('product')
    const file = form.get('file')
    return {
      id: (form.get('id') as string) || undefined,
      product: typeof raw === 'string' ? JSON.parse(raw) : undefined,
      file: file instanceof File && file.size > 0 ? file : undefined,
    }
  }
  const body = (await req.json().catch(() => null)) as { id?: string; product?: Record<string, unknown> } | null
  return body || {}
}

const respond = (result: SaveResult) =>
  NextResponse.json(
    result.ok
      ? { ok: true, mode: result.mode, deployed: result.deployed, products: result.products, product: result.product }
      : { error: result.error },
    { status: result.ok ? 200 : result.status || 500 },
  )

const fail = (e: unknown) =>
  NextResponse.json(
    { error: e instanceof Error ? e.message : 'Error inesperado' },
    { status: e instanceof StoreError ? e.status : 500 },
  )

export async function GET(req: Request) {
  if (!requireAdmin(req)) return unauthorized()
  try {
    return NextResponse.json({ products: await loadProducts() })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return unauthorized()
  try {
    const body = await readBody(req)
    if (!body.product) throw new StoreError('Falta el producto')
    // Validación temprana para no subir la imagen de un producto inválido.
    sanitizeProduct(body.product, 'tmp')
    const image = body.file ? await prepareImage(body.file, String(body.product.name)) : undefined

    const result = await updateCatalog(
      (products) => {
        const id = uniqueId(String(body.product!.name), new Set(products.map((p) => p.id)))
        const product = sanitizeProduct({ ...body.product, image: image?.path ?? body.product!.image }, id)
        return { products: [product, ...products], product }
      },
      `Admin: alta de producto "${String(body.product.name).trim()}"`,
      image,
    )
    return respond(result)
  } catch (e) {
    return fail(e)
  }
}

export async function PUT(req: Request) {
  if (!requireAdmin(req)) return unauthorized()
  try {
    const body = await readBody(req)
    if (!body.id || !body.product) throw new StoreError('Faltan datos')
    sanitizeProduct(body.product, body.id)
    const image = body.file ? await prepareImage(body.file, String(body.product.name)) : undefined

    const result = await updateCatalog(
      (products) => {
        const idx = products.findIndex((p) => p.id === body.id)
        if (idx === -1) throw new StoreError('El producto ya no existe (¿lo borraron?). Recargá la lista.', 404)
        const product = sanitizeProduct({ ...body.product, image: image?.path ?? body.product!.image }, body.id!)
        const next = [...products]
        next[idx] = product
        return { products: next, product }
      },
      `Admin: edición de producto "${String(body.product.name).trim()}"`,
      image,
    )
    return respond(result)
  } catch (e) {
    return fail(e)
  }
}

export async function DELETE(req: Request) {
  if (!requireAdmin(req)) return unauthorized()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const result = await updateCatalog((products) => {
    if (!products.some((p) => p.id === id)) {
      throw new StoreError('Producto no encontrado (puede que ya esté borrado)', 404)
    }
    return { products: products.filter((p) => p.id !== id) }
  }, `Admin: baja de producto "${id}"`)
  return respond(result)
}
