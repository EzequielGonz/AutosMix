import { andreaniQuoteEnabled, quote, type CartLine } from '@/lib/andreani'
import { SHIPPING_RATES, zoneFor } from '@/lib/shipping-rates'

/**
 * Costo de envío calculado en el servidor (Andreani o tabla de tarifas del
 * admin), para no confiar en el monto que manda el navegador al cobrar.
 * Devuelve null si no se puede cotizar ese CP.
 */
export async function serverShippingCost(
  kind: 'domicilio' | 'sucursal',
  cp: string,
  lines: CartLine[],
): Promise<number | null> {
  if (andreaniQuoteEnabled()) {
    try {
      return (await quote(cp, lines))[kind]
    } catch {
      return null
    }
  }
  const zone = zoneFor(SHIPPING_RATES, cp)
  const base = zone ? zone[kind] : null
  if (base === null || base === undefined) return null
  const subtotal = lines.reduce((acc, l) => acc + l.product.price * l.qty, 0)
  const free = SHIPPING_RATES.freeFrom !== null && subtotal >= SHIPPING_RATES.freeFrom
  return free ? 0 : base
}
