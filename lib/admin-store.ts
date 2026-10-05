import { PRODUCTS, SUBCATEGORIES, BADGES, type Product } from '@/lib/products'

/**
 * Persistencia del catálogo.
 *
 * - Local / self-hosted: escribe `data/products.json` y `public/products/*`
 *   directamente en disco.
 * - Producción (Vercel, serverless): el filesystem es de solo lectura, así que
 *   persiste haciendo COMMIT al repo de GitHub (el mismo del que Vercel
 *   despliega). El push dispara el redeploy automático con los datos nuevos.
 *
 * En modo GitHub el catálogo se LEE siempre desde la rama (no del archivo
 * desplegado), y cada cambio es un read-modify-write sobre el último commit:
 * así dos ediciones seguidas antes del redeploy no se pisan entre sí.
 * Imagen + catálogo van en un único commit (un solo redeploy).
 *
 * Env necesarias en Vercel: ADMIN_PASSWORD, GITHUB_TOKEN (fine-grained,
 * permiso Contents: Read & Write sobre este repo), GITHUB_REPO
 * ("owner/repo"), GITHUB_BRANCH (por defecto "main").
 */

const REPO = process.env.GITHUB_REPO || 'EzequielGonz/AutosMix'
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const CATALOG_PATH = 'data/products.json'

export type SaveResult = {
  ok: boolean
  mode: 'local' | 'github'
  deployed?: boolean
  products?: Product[]
  product?: Product
  error?: string
  status?: number
}

/** Error con código HTTP para devolver tal cual al cliente. */
export class StoreError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

function ghToken(): string | null {
  const t = process.env.GITHUB_TOKEN
  return t && t.trim() ? t.trim() : null
}

export const githubEnabled = () => !!ghToken()

async function gh(path: string, init?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${ghToken()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers || {}),
    },
  })
}

async function headSha(): Promise<string> {
  const refRes = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`)
  if (!refRes.ok) {
    throw new StoreError(
      refRes.status === 401 || refRes.status === 403
        ? 'GITHUB_TOKEN inválido o sin permiso "Contents: Read & write" sobre el repo'
        : `No pude leer la rama ${BRANCH} de ${REPO} (${refRes.status})`,
      500,
    )
  }
  const ref = (await refRes.json()) as { object: { sha: string } }
  return ref.object.sha
}

/** Lee un archivo del repo en un commit dado (null si no existe). */
async function readRepoFile(path: string, ref: string): Promise<Buffer | null> {
  const res = await gh(`/repos/${REPO}/contents/${path}?ref=${ref}`, {
    headers: { Accept: 'application/vnd.github.raw+json' },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new StoreError(`No pude leer ${path} desde GitHub (${res.status})`, 500)
  return Buffer.from(await res.arrayBuffer())
}

async function readCatalogAt(ref: string): Promise<Product[]> {
  const buf = await readRepoFile(CATALOG_PATH, ref)
  if (!buf) return PRODUCTS
  return JSON.parse(buf.toString('utf8')) as Product[]
}

type FileChange = { path: string; content: Buffer | null } // null = borrar

/** Commitea varios archivos en un solo commit sobre `baseSha`. Devuelve false si perdió la carrera. */
async function commitFiles(baseSha: string, changes: FileChange[], message: string): Promise<boolean> {
  const tree = []
  for (const c of changes) {
    if (c.content === null) {
      tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null })
      continue
    }
    const blobRes = await gh(`/repos/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: c.content.toString('base64'), encoding: 'base64' }),
    })
    if (!blobRes.ok) throw new StoreError(`Error subiendo ${c.path} a GitHub (${blobRes.status})`, 500)
    const blob = (await blobRes.json()) as { sha: string }
    tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha })
  }

  const treeRes = await gh(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseSha, tree }),
  })
  if (!treeRes.ok) throw new StoreError(`Error creando tree (${treeRes.status})`, 500)
  const newTree = (await treeRes.json()) as { sha: string }

  const commitRes = await gh(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseSha] }),
  })
  if (!commitRes.ok) throw new StoreError(`Error creando commit (${commitRes.status})`, 500)
  const commit = (await commitRes.json()) as { sha: string }

  const update = await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })
  if (update.ok) return true
  // 422 = no es fast-forward (otra escritura ganó): reintentar con la base nueva.
  if (update.status === 422 || update.status === 409) return false
  throw new StoreError(`No pude actualizar la rama ${BRANCH} (${update.status})`, 500)
}

const localPath = async (...parts: string[]) => {
  const { join } = await import('path')
  return join(/*turbopackIgnore: true*/ process.cwd(), ...parts)
}

async function loadProductsLocal(): Promise<Product[]> {
  try {
    const { readFile } = await import('fs/promises')
    const raw = await readFile(await localPath('data', 'products.json'), 'utf8')
    return JSON.parse(raw) as Product[]
  } catch {
    return PRODUCTS
  }
}

const catalogJson = (products: Product[]) => JSON.stringify(products, null, 2) + '\n'

/** Catálogo vigente: en modo GitHub, el de la rama (incluye cambios aún no desplegados). */
export async function loadProducts(): Promise<Product[]> {
  if (!ghToken()) return loadProductsLocal()
  return readCatalogAt(await headSha())
}

/** Imágenes subidas por el admin que ya no usa ningún producto (para limpiarlas). */
function orphanImages(before: Product[], after: Product[]): string[] {
  const used = new Set(after.map((p) => p.image))
  return [...new Set(before.map((p) => p.image))].filter(
    (img) => img && img.startsWith('/products/') && !used.has(img) && /^\/products\/[\w.-]+$/.test(img),
  )
}

export type Mutation = (products: Product[]) => { products: Product[]; product?: Product }

/**
 * Aplica `mutate` sobre el catálogo más reciente y lo guarda (junto con la
 * imagen nueva, si hay) de forma atómica. Reintenta si hubo otra escritura
 * concurrente.
 */
export async function updateCatalog(
  mutate: Mutation,
  message: string,
  image?: { path: string; data: Buffer },
): Promise<SaveResult> {
  try {
    if (!ghToken()) {
      const before = await loadProductsLocal()
      const { products, product } = mutate(before)
      const { writeFile, mkdir, unlink } = await import('fs/promises')
      try {
        if (image) {
          await mkdir(await localPath('public', 'products'), { recursive: true })
          await writeFile(await localPath('public', image.path), image.data)
        }
        await mkdir(await localPath('data'), { recursive: true })
        await writeFile(await localPath('data', 'products.json'), catalogJson(products), 'utf8')
      } catch {
        throw new StoreError(
          'No pude escribir el catálogo. En producción configurá GITHUB_TOKEN (fine-grained, permiso Contents: Read & write sobre este repo) para guardar vía GitHub.',
          500,
        )
      }
      for (const img of orphanImages(before, products)) {
        await unlink(await localPath('public', img)).catch(() => {})
      }
      return { ok: true, mode: 'local', deployed: false, products, product }
    }

    for (let attempt = 0; attempt < 4; attempt++) {
      const base = await headSha()
      const before = await readCatalogAt(base)
      const { products, product } = mutate(before)

      const changes: FileChange[] = [{ path: CATALOG_PATH, content: Buffer.from(catalogJson(products), 'utf8') }]
      if (image) changes.push({ path: `public${image.path}`, content: image.data })
      for (const img of orphanImages(before, products)) changes.push({ path: `public${img}`, content: null })

      if (await commitFiles(base, changes, message)) {
        return { ok: true, mode: 'github', deployed: true, products, product }
      }
    }
    throw new StoreError('Hubo varios cambios simultáneos y no pude guardar. Probá de nuevo.', 409)
  } catch (e) {
    const status = e instanceof StoreError ? e.status : 500
    return {
      ok: false,
      mode: ghToken() ? 'github' : 'local',
      status,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

/** Lee un JSON de `data/` (desde la rama en modo GitHub). */
export async function loadDataFile<T>(name: string, fallback: T): Promise<T> {
  try {
    if (ghToken()) {
      const buf = await readRepoFile(`data/${name}`, await headSha())
      return buf ? (JSON.parse(buf.toString('utf8')) as T) : fallback
    }
    const { readFile } = await import('fs/promises')
    return JSON.parse(await readFile(await localPath('data', name), 'utf8')) as T
  } catch (e) {
    if (e instanceof StoreError) throw e
    return fallback
  }
}

/** Guarda un JSON en `data/` (commit a GitHub en producción). */
export async function saveDataFile(name: string, data: unknown, message: string): Promise<SaveResult> {
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf8')
  try {
    if (!ghToken()) {
      const { writeFile } = await import('fs/promises')
      await writeFile(await localPath('data', name), content).catch(() => {
        throw new StoreError('No pude escribir el archivo. En producción configurá GITHUB_TOKEN.', 500)
      })
      return { ok: true, mode: 'local', deployed: false }
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await commitFiles(await headSha(), [{ path: `data/${name}`, content }], message)) {
        return { ok: true, mode: 'github', deployed: true }
      }
    }
    throw new StoreError('Hubo varios cambios simultáneos y no pude guardar. Probá de nuevo.', 409)
  } catch (e) {
    return {
      ok: false,
      mode: ghToken() ? 'github' : 'local',
      status: e instanceof StoreError ? e.status : 500,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

/** Lee una imagen de producto (para previsualizar en el admin antes del redeploy). */
export async function readProductImage(publicPath: string): Promise<Buffer | null> {
  if (!/^\/products\/[\w.-]+$/.test(publicPath)) return null
  if (ghToken()) return readRepoFile(`public${publicPath}`, BRANCH)
  try {
    const { readFile } = await import('fs/promises')
    return await readFile(await localPath('public', publicPath))
  } catch {
    return null
  }
}

const IMAGE_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}
/** Vercel corta los requests a ~4.5 MB; el admin comprime antes de subir. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export const imageExtFor = (mime: string) => IMAGE_TYPES[mime] || null

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
    .replace(/-$/, '') || 'producto'

/** Valida la imagen y devuelve su ruta pública + contenido. */
export async function prepareImage(file: File, productName: string): Promise<{ path: string; data: Buffer }> {
  if (file.size > MAX_IMAGE_BYTES) throw new StoreError('La imagen pesa más de 4 MB', 413)
  const data = Buffer.from(await file.arrayBuffer())
  // El MIME que manda el navegador no siempre es confiable: se mira el contenido.
  const ext = sniffImage(data) || imageExtFor(file.type)
  if (!ext) throw new StoreError('Formato no soportado (usá WebP, JPG o PNG)')
  const name = `${slug(productName)}-${Date.now().toString(36)}.${ext}`
  return { path: `/products/${name}`, data }
}

function sniffImage(b: Buffer): string | null {
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'png'
  return null
}

/** Id único a partir del nombre. */
export function uniqueId(name: string, existing: Set<string>): string {
  const base = slug(name)
  if (!existing.has(base)) return base
  for (let i = 2; ; i++) if (!existing.has(`${base}-${i}`)) return `${base}-${i}`
}

const CATEGORY_IDS = ['iluminacion', 'accesorios', 'seguridad', 'estetica'] as const
const num = (v: unknown) => (v === '' || v === null || v === undefined ? NaN : Number(v))

/**
 * Normaliza y valida un producto. `id` lo decide el servidor: el existente al
 * editar, o uno nuevo y único al crear. Lanza StoreError con el motivo.
 */
export function sanitizeProduct(input: unknown, id: string): Product {
  const p = (input || {}) as Record<string, unknown>
  const name = typeof p.name === 'string' ? p.name.trim() : ''
  if (!name) throw new StoreError('El nombre es obligatorio')
  const price = num(p.price)
  if (!Number.isFinite(price) || price < 0) throw new StoreError('El precio es inválido')

  const category = CATEGORY_IDS.includes(p.category as never) ? (p.category as Product['category']) : 'accesorios'

  const out: Product = {
    id,
    name: name.slice(0, 140),
    price: Math.round(price),
    category,
    brand: (typeof p.brand === 'string' && p.brand.trim() ? p.brand.trim() : 'Otros').slice(0, 40),
    image: typeof p.image === 'string' ? p.image.trim().slice(0, 300) : '',
    rating: Math.min(5, Math.max(0, Number.isFinite(num(p.rating)) ? num(p.rating) : 4.7)),
    reviews: Math.max(0, Math.round(num(p.reviews) || 0)),
    stock: Math.max(0, Math.round(num(p.stock) || 0)),
  }

  // La subcategoría tiene que pertenecer a la categoría elegida.
  const sub = SUBCATEGORIES.find((s) => s.id === p.subcategory && s.category === category)
  if (sub) out.subcategory = sub.id

  const oldPrice = num(p.oldPrice)
  if (Number.isFinite(oldPrice) && oldPrice > price) out.oldPrice = Math.round(oldPrice)
  if (BADGES.includes(p.badge as never)) out.badge = p.badge as Product['badge']
  if (typeof p.description === 'string' && p.description.trim()) {
    out.description = p.description.trim().slice(0, 4000)
  }

  // Datos para cotizar el envío con Andreani (opcionales).
  const weight = num(p.weight)
  if (Number.isFinite(weight) && weight > 0) out.weight = Math.round(weight * 1000) / 1000
  const dims = ['length', 'width', 'height'].map((k) => num(p[k]))
  if (dims.every((d) => Number.isFinite(d) && d > 0)) {
    ;[out.length, out.width, out.height] = dims.map((d) => Math.round(d * 10) / 10)
  }
  return out
}
