import rawRates from '@/data/shipping.json'

/**
 * Tarifas de envío por zona, editables desde /admin (pestaña Envíos).
 * Se usan para cotizar en el carrito cuando no hay credenciales de la API de
 * Andreani. Un precio en 0 o vacío = "a coordinar" para esa zona.
 */
export type ShippingZone = {
  id: string
  label: string
  /** Rangos de códigos postales, ej. "7600-7613, 7620". Vacío = resto del país. */
  ranges: string
  /** Envío a domicilio (null = a coordinar). */
  domicilio: number | null
  /** Envío a sucursal Andreani (null = no se ofrece). */
  sucursal: number | null
}

export type ShippingRates = {
  zones: ShippingZone[]
  /** Envío gratis desde este subtotal (null = nunca). */
  freeFrom: number | null
}

export const SHIPPING_RATES = rawRates as ShippingRates

function parseRanges(ranges: string): [number, number][] {
  return ranges
    .split(/[,;\s]+/)
    .filter(Boolean)
    .flatMap((r) => {
      const [a, b] = r.split('-').map((n) => parseInt(n, 10))
      if (!Number.isFinite(a)) return []
      return [[a, Number.isFinite(b) ? b : a] as [number, number]]
    })
}

/** Zona que corresponde a un CP: la primera con rango que lo incluya, o la "resto del país". */
export function zoneFor(rates: ShippingRates, cp: string): ShippingZone | null {
  const n = parseInt(cp, 10)
  const ranged = rates.zones.find((z) => parseRanges(z.ranges).some(([a, b]) => n >= a && n <= b))
  return ranged || rates.zones.find((z) => !z.ranges.trim()) || null
}

export const ratesConfigured = (rates: ShippingRates) =>
  rates.zones.some((z) => (z.domicilio ?? 0) > 0 || (z.sucursal ?? 0) > 0)

const price = (v: unknown) => {
  const n = Math.round(Number(v))
  return v === '' || v === null || v === undefined || !Number.isFinite(n) || n <= 0 ? null : n
}

export function sanitizeRates(input: unknown): ShippingRates {
  const r = (input || {}) as Partial<ShippingRates>
  const zones = (Array.isArray(r.zones) ? r.zones : []).slice(0, 20).map((z, i) => ({
    id: String(z?.id || `zona-${i + 1}`).slice(0, 40),
    label: String(z?.label || `Zona ${i + 1}`).slice(0, 60),
    ranges: String(z?.ranges || '').replace(/[^\d,;\s-]/g, '').slice(0, 300),
    domicilio: price(z?.domicilio),
    sucursal: price(z?.sucursal),
  }))
  return { zones, freeFrom: price(r.freeFrom) }
}
