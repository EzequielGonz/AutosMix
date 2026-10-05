'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, PackageSearch, Truck } from 'lucide-react'
import { STORE } from '@/lib/products'

type Tracking = {
  numero: string
  estado: string
  eventos: { fecha: string; estado: string; sucursal?: string; motivo?: string }[]
}

const andreaniUrl = (n: string) => `https://www.andreani.com/envio/${encodeURIComponent(n)}`

const fmtDate = (f: string) => {
  const d = new Date(f)
  return f && !isNaN(d.getTime()) ? d.toLocaleString('es-AR') : f
}

export default function SeguimientoPage() {
  const [numero, setNumero] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<Tracking | null>(null)

  const buscar = async (n: string) => {
    const clean = n.replace(/\s/g, '')
    if (!clean) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch(`/api/shipping/track?numero=${encodeURIComponent(clean)}`)
      const d = await res.json().catch(() => ({}))
      if (d.enabled === false) {
        // Sin credenciales de API: se consulta directo en la web de Andreani.
        window.location.href = andreaniUrl(clean)
        return
      }
      if (!res.ok || d.error) setError(d.error || 'No pudimos consultar el envío')
      else setData(d)
    } catch {
      setError('Sin conexión. Probá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Permite compartir el link /seguimiento?numero=XXXX
  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('numero')
    if (n) {
      setNumero(n)
      buscar(n)
    }
  }, [])

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-12">
      <Link href="/" className="text-xs text-white/40 hover:text-white">
        ← Volver a la tienda
      </Link>
      <h1 className="mt-6 flex items-center gap-3 font-display text-2xl uppercase">
        <Truck className="size-7 text-brand" /> Seguí tu envío
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Ingresá el número de seguimiento de Andreani que te pasamos por WhatsApp.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          buscar(numero)
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Ej: 360000123456780"
          aria-label="Número de seguimiento"
          className="h-11 flex-1 rounded-xl border border-line bg-panel px-3 text-sm outline-none placeholder:text-white/30 focus:border-brand"
        />
        <button
          type="submit"
          disabled={loading || !numero.trim()}
          className="flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold uppercase transition hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <PackageSearch className="size-4" />}
          Buscar
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-brand/50 bg-brand/10 p-3 text-sm text-brand">
          {error}{' '}
          {numero.trim() && (
            <a href={andreaniUrl(numero.trim())} target="_blank" rel="noreferrer" className="underline">
              Ver en andreani.com
            </a>
          )}
        </div>
      )}

      {data && (
        <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">Envío {data.numero}</p>
          <p className="mt-1 font-display text-xl uppercase text-brand">{data.estado}</p>
          {data.eventos.length > 0 && (
            <ol className="mt-5 space-y-4 border-l border-line pl-4">
              {data.eventos.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-brand" />
                  <p className="text-sm font-semibold">{e.estado}</p>
                  <p className="text-xs text-white/45">
                    {fmtDate(e.fecha)}
                    {e.sucursal ? ` · ${e.sucursal}` : ''}
                  </p>
                  {e.motivo && <p className="text-xs text-white/45">{e.motivo}</p>}
                </li>
              ))}
            </ol>
          )}
          <a
            href={andreaniUrl(data.numero)}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"
          >
            <ExternalLink className="size-3.5" /> Ver en andreani.com
          </a>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-white/35">
        ¿Dudas con tu envío? Escribinos al{' '}
        <a href={`https://wa.me/${STORE.whatsapp}`} className="text-white/60 hover:text-brand">
          WhatsApp {STORE.whatsappDisplay}
        </a>
      </p>
    </main>
  )
}
