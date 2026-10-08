import { NextResponse } from 'next/server'
import { andreaniTrackingEnabled, track } from '@/lib/andreani'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Seguimiento de un envío Andreani: GET /api/shipping/track?numero=360000... */
export async function GET(req: Request) {
  const numero = (new URL(req.url).searchParams.get('numero') || '').replace(/\s/g, '')
  if (!/^[A-Za-z0-9]{6,30}$/.test(numero)) {
    return NextResponse.json({ error: 'Número de seguimiento inválido' }, { status: 400 })
  }
  if (!andreaniTrackingEnabled()) return NextResponse.json({ enabled: false })

  try {
    const data = await track(numero)
    if (!data) return NextResponse.json({ enabled: true, error: 'No encontramos ese envío' }, { status: 404 })
    return NextResponse.json({ enabled: true, ...data })
  } catch {
    return NextResponse.json({ enabled: true, error: 'Andreani no responde. Probá de nuevo en un rato.' }, { status: 502 })
  }
}
