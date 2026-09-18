import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Auth mínima del panel de administración:
 * - Login: POST /api/admin/login con la contraseña (env ADMIN_PASSWORD).
 * - Sesión: cookie httpOnly `am_admin` con un token HMAC-SHA256 de
 *   `exp.admin` firmado con ADMIN_PASSWORD. Sin DB, sin dependencias.
 */

export const ADMIN_COOKIE = 'am_admin'
const SESSION_DAYS = 7

const secret = () => process.env.ADMIN_PASSWORD || ''

export const adminConfigured = () => secret().length >= 6

export function checkPassword(candidate: string): boolean {
  const s = secret()
  if (!s) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(s)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex')
}

export function createSessionToken(): { token: string; maxAge: number } {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = `admin.${exp}`
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_DAYS * 24 * 60 * 60 }
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'admin') return false
  const payload = `${parts[0]}.${parts[1]}`
  const expected = sign(payload)
  const a = Buffer.from(parts[2])
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false
  return Number(parts[1]) > Date.now()
}

/** Guardia para las API routes: responde 401 y devuelve false si no hay sesión. */
export function requireAdmin(req: Request): boolean {
  const cookie = req.headers.get('cookie') || ''
  const token = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1)
  return verifySessionToken(token ? decodeURIComponent(token) : null)
}
