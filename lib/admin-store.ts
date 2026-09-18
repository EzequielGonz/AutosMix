import { PRODUCTS, type Product } from '@/lib/products'

/**
 * Persistencia del catálogo.
 *
 * - Local / self-hosted: escribe `data/products.json` y `public/products/*`
 *   directamente en disco.
 * - Producción (Vercel, serverless): el filesystem es de solo lectura, así que
 *   persiste haciendo COMMIT al repo de GitHub (el mismo del que Vercel
 *   despliega). El push dispara el redeploy automático con los datos nuevos.
 *
 * Env necesarias en Vercel: ADMIN_PASSWORD, GITHUB_TOKEN (fine-grained,
 * permiso Contents: Read & Write sobre este repo), GITHUB_REPO
 * ("owner/repo"; si no está, se detecta del .git local en build).
 */

const REPO = process.env.GITHUB_REPO || 'EzequielGonz/AutosMix'
const BRANCH = process.env.GITHUB_BRANCH || 'main'

export type SaveResult = { ok: boolean; mode: 'local' | 'github'; deployed?: boolean; error?: string }

function ghToken(): string | null {
  const t = process.env.GITHUB_TOKEN
  return t && t.trim() ? t.trim() : null
}

export const githubEnabled = () => !!ghToken()

async function gh(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${ghToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    },
  })
  return res
}

/** Crea un blob y lo commitea a `path` en BRANCH (con reintentos por carrera). */
async function commitFile(path: string, content: string | Buffer, message: string): Promise<void> {
  const contentB64 = Buffer.isBuffer(content)
    ? content.toString('base64')
    : Buffer.from(content, 'utf8').toString('base64')

  for (let attempt = 0; attempt < 3; attempt++) {
    const refRes = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`)
    if (!refRes.ok) throw new Error(`No pude leer la rama ${BRANCH} de ${REPO} (${refRes.status})`)
    const ref = (await refRes.json()) as { object: { sha: string } }
    const baseSha = ref.object.sha

    const blobRes = await gh(`/repos/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: contentB64, encoding: 'base64' }),
    })
    if (!blobRes.ok) throw new Error(`Error creando blob (${blobRes.status})`)
    const blob = (await blobRes.json()) as { sha: string }

    const treeRes = await gh(`/repos/${REPO}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseSha, tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }] }),
    })
    if (!treeRes.ok) throw new Error(`Error creando tree (${treeRes.status})`)
    const tree = (await treeRes.json()) as { sha: string }

    const commitRes = await gh(`/repos/${REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
    })
    if (!commitRes.ok) throw new Error(`Error creando commit (${commitRes.status})`)
    const commit = (await commitRes.json()) as { sha: string }

    // Fast-forward. Si otra escritura ganó la carrera, reintento con la base nueva.
    const update = await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false }),
    })
    if (update.ok) return
    if (attempt === 2) throw new Error(`No pude actualizar la rama (${update.status}) tras 3 intentos`)
  }
}

async function saveProductsLocal(products: Product[]) {
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  const file = join(process.cwd(), 'data', 'products.json')
  await mkdir(join(process.cwd(), 'data'), { recursive: true })
  await writeFile(file, JSON.stringify(products, null, 2) + '\n', 'utf8')
}

/** Guarda el catálogo completo: local siempre, y además commit a GitHub si hay token. */
export async function saveProducts(products: Product[], message: string): Promise<SaveResult> {
  const json = JSON.stringify(products, null, 2) + '\n'

  if (!ghToken()) {
    try {
      await saveProductsLocal(products)
      return { ok: true, mode: 'local', deployed: false }
    } catch {
      return {
        ok: false,
        mode: 'local',
        error:
          'No pude escribir el catálogo. En producción configurá GITHUB_TOKEN (fine-grained, permiso Contents: Read & write sobre este repo) para guardar vía GitHub.',
      }
    }
  }

  try {
    await commitFile('data/products.json', json, message)
    // Espejo local para que el entorno dev quede sincronizado.
    await saveProductsLocal(products).catch(() => {})
    return { ok: true, mode: 'github', deployed: true }
  } catch (e) {
    return { ok: false, mode: 'github', error: e instanceof Error ? e.message : String(e) }
  }
}

const IMAGE_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const imageExtFor = (mime: string) => IMAGE_TYPES[mime] || null

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'producto'

export const imageFileName = (name: string, mime: string) =>
  `${slug(name)}-${Date.now().toString(36)}.${imageExtFor(mime)}`

/** Guarda la imagen localmente; devuelve la ruta pública o null si falla. */
export async function saveImageLocal(file: File): Promise<string | null> {
  try {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const name = imageFileName(file.name, file.type)
    const dir = join(process.cwd(), 'public', 'products')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()))
    return `/products/${name}`
  } catch {
    return null
  }
}

/** Sube la imagen commiteándola al repo; devuelve la ruta pública. */
export async function saveImageGithub(file: File): Promise<string> {
  const name = imageFileName(file.name, file.type)
  const path = `public/products/${name}`
  await commitFile(path, Buffer.from(await file.arrayBuffer()), `Admin: imagen ${name}`)
  return `/products/${name}`
}

export async function saveImage(file: File): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!imageExtFor(file.type)) return { ok: false, error: 'Formato no soportado (usá WebP, JPG o PNG)' }
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'La imagen pesa más de 5 MB' }

  if (!ghToken()) {
    const p = await saveImageLocal(file)
    return p ? { ok: true, path: p } : { ok: false, error: 'No pude guardar la imagen' }
  }

  try {
    return { ok: true, path: await saveImageGithub(file) }
  } catch (e) {
    // Fallback local (solo útil en dev) para no bloquear la edición.
    const p = await saveImageLocal(file)
    if (p) return { ok: true, path: p }
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Normaliza y valida un producto antes de guardarlo. */
export function sanitizeProduct(input: unknown, existingIds: Set<string>): Product | null {
  const p = input as Partial<Product>
  if (!p || typeof p.name !== 'string' || !p.name.trim()) return null
  const price = Number(p.price)
  if (!Number.isFinite(price) || price < 0) return null

  const id =
    typeof p.id === 'string' && p.id.trim()
      ? p.id.trim()
      : slug(p.name) + (existingIds.size ? `-${existingIds.size + 1}` : '')

  const out: Product = {
    id,
    name: p.name.trim().slice(0, 140),
    price: Math.round(price),
    category: (['iluminacion', 'accesorios', 'seguridad', 'estetica'] as const).includes(p.category as never)
      ? (p.category as Product['category'])
      : 'accesorios',
    brand: (p.brand || 'Otros').toString().slice(0, 40),
    image: (p.image || '').toString().slice(0, 300),
    rating: Math.min(5, Math.max(0, Number(p.rating) || 4.7)),
    reviews: Math.max(0, Math.round(Number(p.reviews) || 0)),
    stock: Math.max(0, Math.round(Number(p.stock) || 0)),
  }
  if (p.subcategory) out.subcategory = p.subcategory as Product['subcategory']
  if (p.oldPrice && Number(p.oldPrice) > price) out.oldPrice = Math.round(Number(p.oldPrice))
  if (p.badge && ['MÁS VENDIDO', 'OFERTA', 'NUEVO', 'PREMIUM'].includes(p.badge)) out.badge = p.badge as Product['badge']
  return out
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')
    const raw = await readFile(join(process.cwd(), 'data', 'products.json'), 'utf8')
    return JSON.parse(raw) as Product[]
  } catch {
    return PRODUCTS
  }
}
