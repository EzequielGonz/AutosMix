import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { saveImage } from '@/lib/admin-store'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })

  const result = await saveImage(file)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
