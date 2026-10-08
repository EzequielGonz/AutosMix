import { requireAdmin } from '@/lib/admin-auth'
import { readProductImage } from '@/lib/admin-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' }

/**
 * Sirve una imagen de producto leyéndola del repo. Sirve para que el admin vea
 * las fotos recién subidas antes de que termine el redeploy de Vercel.
 */
export async function GET(req: Request) {
  if (!requireAdmin(req)) return new Response('No autorizado', { status: 401 })
  const path = new URL(req.url).searchParams.get('path') || ''
  const data = await readProductImage(path).catch(() => null)
  if (!data) return new Response('No encontrada', { status: 404 })
  const ext = path.split('.').pop()?.toLowerCase() || ''
  return new Response(new Uint8Array(data), {
    headers: { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'private, max-age=300' },
  })
}
