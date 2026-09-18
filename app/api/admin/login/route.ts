import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, adminConfigured, checkPassword, createSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ configured: adminConfigured() })
}

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD no está configurada. Definila en .env.local (local) y en las variables de entorno de Vercel.' },
      { status: 500 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string }
  if (!checkPassword(body.password || '')) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const { token, maxAge } = createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, encodeURIComponent(token), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })
  return res
}
