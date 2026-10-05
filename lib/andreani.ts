import type { Product } from '@/lib/products'

/**
 * Integración con la API de Andreani (https://developers.andreani.com).
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   ANDREANI_USER, ANDREANI_PASSWORD  credenciales de API que da el ejecutivo
 *                                     de cuenta de Andreani (para seguimiento).
 *   ANDREANI_CLIENTE                  código de cliente (ej. CL0001234).
 *   ANDREANI_CONTRATO                 contrato de envío a domicilio.
 *   ANDREANI_CONTRATO_SUCURSAL        (opcional) contrato de envío a sucursal.
 *   ANDREANI_SUCURSAL_ORIGEN          (opcional) sucursal donde se despacha
 *                                     (si no, el origen es el del contrato).
 *   ANDREANI_QA=1                     (opcional) usa el entorno de pruebas.
 *
 * Sin cliente/contrato la cotización queda deshabilitada y la tienda sigue
 * mostrando "envío a coordinar".
 */

const BASE = process.env.ANDREANI_QA === '1' ? 'https://apisqa.andreani.com' : 'https://apis.andreani.com'

const env = (k: string) => process.env[k]?.trim() || ''

export const andreaniQuoteEnabled = () => !!(env('ANDREANI_CLIENTE') && env('ANDREANI_CONTRATO'))
export const andreaniTrackingEnabled = () => !!(env('ANDREANI_USER') && env('ANDREANI_PASSWORD'))

/** Medidas por defecto cuando el producto no tiene peso/medidas cargadas. */
const DEFAULT_PACKAGE = { weight: 1, length: 20, width: 15, height: 10 }

let tokenCache: { token: string; exp: number } | null = null

async function authToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now()) return tokenCache.token
  const basic = Buffer.from(`${env('ANDREANI_USER')}:${env('ANDREANI_PASSWORD')}`).toString('base64')
  const res = await fetch(`${BASE}/login`, { headers: { Authorization: `Basic ${basic}` }, cache: 'no-store' })
  const token = res.headers.get('x-authorization-token')
  if (!res.ok || !token) throw new Error(`Login en Andreani falló (${res.status}). Revisá ANDREANI_USER/PASSWORD.`)
  // El token dura 24 h; lo renovamos antes.
  tokenCache = { token, exp: Date.now() + 20 * 60 * 60 * 1000 }
  return token
}

export type CartLine = { product: Product; qty: number }

/** Arma un único bulto con el peso y volumen total del pedido. */
export function packageFor(lines: CartLine[]) {
  let kilos = 0
  let volumen = 0
  let valor = 0
  for (const { product: p, qty } of lines) {
    const w = p.weight || DEFAULT_PACKAGE.weight
    const vol =
      (p.length || DEFAULT_PACKAGE.length) * (p.width || DEFAULT_PACKAGE.width) * (p.height || DEFAULT_PACKAGE.height)
    kilos += w * qty
    volumen += vol * qty
    valor += p.price * qty
  }
  return { kilos: Math.max(0.1, Math.round(kilos * 100) / 100), volumen: Math.round(volumen), valorDeclarado: valor }
}

type TarifaResponse = {
  pesoAforado?: string
  tarifaConIva?: { total?: string }
  tarifaSinIva?: { total?: string }
}

async function tarifa(cp: string, contrato: string, bulto: ReturnType<typeof packageFor>): Promise<number | null> {
  const qs = new URLSearchParams({
    cpDestino: cp,
    contrato,
    cliente: env('ANDREANI_CLIENTE'),
    'bultos[0][valorDeclarado]': String(bulto.valorDeclarado),
    'bultos[0][volumen]': String(bulto.volumen),
    'bultos[0][kilos]': String(bulto.kilos),
  })
  if (env('ANDREANI_SUCURSAL_ORIGEN')) qs.set('sucursalOrigen', env('ANDREANI_SUCURSAL_ORIGEN'))

  const res = await fetch(`${BASE}/v1/tarifas?${qs}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data = (await res.json()) as TarifaResponse
  const total = Number(data.tarifaConIva?.total ?? data.tarifaSinIva?.total)
  return Number.isFinite(total) && total > 0 ? Math.round(total) : null
}

export type Quote = {
  domicilio: number | null
  sucursal: number | null
  sucursales: Branch[]
}

export type Branch = { id: string; nombre: string; direccion: string; horario?: string }

type SucursalApi = {
  id: number
  descripcion: string
  direccion?: { calle?: string; numero?: string; localidad?: string; codigoPostal?: string }
  horarioDeAtencion?: string
  datosAdicionales?: { entregaEnvios?: boolean; seHaceAtencionAlCliente?: boolean; tipo?: string }
}

/** Sucursales Andreani que entregan envíos en un código postal (API pública). */
export async function branchesFor(cp: string): Promise<Branch[]> {
  try {
    const res = await fetch(`${BASE}/v2/sucursales?codigoPostal=${encodeURIComponent(cp)}`, {
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) return []
    const list = (await res.json()) as SucursalApi[]
    return list
      // Solo sucursales con atención al público (excluye depósitos y centros de distribución).
      .filter(
        (s) =>
          s.datosAdicionales?.entregaEnvios !== false &&
          s.datosAdicionales?.seHaceAtencionAlCliente !== false &&
          (!s.datosAdicionales?.tipo || s.datosAdicionales.tipo === 'SUCURSAL'),
      )
      .slice(0, 5)
      .map((s) => ({
        id: String(s.id),
        nombre: s.descripcion,
        direccion: [s.direccion?.calle, s.direccion?.numero, s.direccion?.localidad].filter(Boolean).join(' '),
        horario: s.horarioDeAtencion,
      }))
  } catch {
    return []
  }
}

export async function quote(cp: string, lines: CartLine[]): Promise<Quote> {
  const bulto = packageFor(lines)
  const contratoSucursal = env('ANDREANI_CONTRATO_SUCURSAL')
  const [domicilio, sucursal, sucursales] = await Promise.all([
    tarifa(cp, env('ANDREANI_CONTRATO'), bulto),
    contratoSucursal ? tarifa(cp, contratoSucursal, bulto) : Promise.resolve(null),
    contratoSucursal ? branchesFor(cp) : Promise.resolve([]),
  ])
  return { domicilio, sucursal, sucursales }
}

export type TrackingEvent = { fecha: string; estado: string; sucursal?: string; motivo?: string }
export type Tracking = { numero: string; estado: string; eventos: TrackingEvent[] }

type EnvioApi = { numeroDeTracking?: string; estado?: string }
type TrazasApi = {
  eventos?: { Fecha?: string; Estado?: string; Sucursal?: string; Motivo?: string; fecha?: string; estado?: string; sucursal?: string; motivo?: string }[]
}

/** Estado e historial de un envío por número de seguimiento. */
export async function track(numero: string): Promise<Tracking | null> {
  const token = await authToken()
  const headers = { 'x-authorization-token': token }
  const [envioRes, trazasRes] = await Promise.all([
    fetch(`${BASE}/v2/envios/${encodeURIComponent(numero)}`, { headers, cache: 'no-store' }),
    fetch(`${BASE}/v2/envios/${encodeURIComponent(numero)}/trazas`, { headers, cache: 'no-store' }),
  ])
  if (envioRes.status === 404) return null
  if (!envioRes.ok) throw new Error(`Andreani respondió ${envioRes.status}`)
  const envio = (await envioRes.json()) as EnvioApi
  const trazas = trazasRes.ok ? ((await trazasRes.json()) as TrazasApi) : { eventos: [] }

  return {
    numero: envio.numeroDeTracking || numero,
    estado: envio.estado || 'Sin información',
    eventos: (trazas.eventos || [])
      .map((e) => ({
        fecha: e.Fecha || e.fecha || '',
        estado: e.Estado || e.estado || '',
        sucursal: e.Sucursal || e.sucursal || undefined,
        motivo: e.Motivo || e.motivo || undefined,
      }))
      .reverse(),
  }
}
