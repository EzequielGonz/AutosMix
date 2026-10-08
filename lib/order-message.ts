import { formatPrice, transferPrice } from '@/lib/products'

/**
 * Formato del mensaje de pedido que el carrito manda por WhatsApp.
 * El admin lo lee de vuelta (pegando el mensaje) para descontar stock y
 * avisar el despacho, así que armado y lectura viven juntos acá.
 */

/** Datos que pide Andreani para generar un envío. */
export type Customer = {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  calle: string
  numero: string
  piso: string
  depto: string
  cp: string
  localidad: string
  provincia: string
  /** Entre calles / referencias para el repartidor. */
  referencias: string
}

export const EMPTY_CUSTOMER: Customer = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  calle: '',
  numero: '',
  piso: '',
  depto: '',
  cp: '',
  localidad: '',
  provincia: '',
  referencias: '',
}

export const PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]

export type OrderLine = { qty: number; name: string; subtotal: number }

export type OrderMessageInput = {
  lines: OrderLine[]
  subtotal: number
  shippingCost: number
  shippingText: string
  /** Envío a domicilio: se piden y muestran los datos de la dirección. */
  needsAddress: boolean
  /** Sucursal Andreani elegida (envío a sucursal). */
  branch?: string
  customer: Customer
}

export function buildOrderMessage(o: OrderMessageInput): string {
  const c = o.customer
  const total = o.subtotal + o.shippingCost
  const transfer = transferPrice(o.subtotal) + o.shippingCost
  const out = [
    '¡Hola AutosMix! Quiero hacer un pedido:',
    '',
    ...o.lines.map((l) => `• ${l.qty}x ${l.name} — ${formatPrice(l.subtotal)}`),
    '',
    `Subtotal: ${formatPrice(o.subtotal)}`,
    o.shippingText,
    `Total: ${formatPrice(total)}`,
    `Total por transferencia (10% OFF en productos): ${formatPrice(transfer)}`,
    '',
    'Mis datos:',
    `Nombre: ${[c.nombre.trim(), c.apellido.trim()].filter(Boolean).join(' ')}`,
  ]
  if (c.dni.trim()) out.push(`DNI: ${c.dni.trim()}`)
  out.push(`Teléfono: ${c.telefono.trim()}`)
  if (c.email.trim()) out.push(`Email: ${c.email.trim()}`)
  if (o.needsAddress) {
    const calle = [c.calle.trim(), c.numero.trim()].filter(Boolean).join(' ')
    const unidad = [c.piso.trim() && `piso ${c.piso.trim()}`, c.depto.trim() && `depto ${c.depto.trim()}`]
      .filter(Boolean)
      .join(' ')
    out.push(`Dirección: ${calle}${unidad ? `, ${unidad}` : ''}`)
    out.push(`Ciudad: ${c.localidad.trim()}, ${c.provincia.trim()}`)
    out.push(`Código postal: ${c.cp.trim()}`)
    if (c.referencias.trim()) out.push(`Entre calles / referencias: ${c.referencias.trim()}`)
  }
  if (o.branch) out.push(`Sucursal Andreani: ${o.branch}`)
  return out.join('\n')
}

/** Valida los datos según el tipo de entrega. Devuelve el primer error o null. */
export function validateCustomer(c: Customer, opts: { needsAddress: boolean; needsId: boolean }): string | null {
  if (c.nombre.trim().length < 2) return 'Completá tu nombre'
  if (c.apellido.trim().length < 2) return 'Completá tu apellido'
  if (c.telefono.replace(/\D/g, '').length < 8) return 'Completá un teléfono válido (con código de área)'
  if (opts.needsId && !/^\d{7,8}$/.test(c.dni.replace(/\D/g, ''))) return 'Completá tu DNI (7 u 8 números)'
  if (opts.needsId && !c.email.trim()) return 'Completá tu email (ahí te llegan los avisos de Andreani)'
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return 'El email no es válido'
  if (opts.needsAddress) {
    if (!c.calle.trim() || !c.numero.trim()) return 'Completá la calle y el número'
    if (!/^\d{4}$/.test(c.cp.trim())) return 'Completá el código postal (4 números)'
    if (!c.localidad.trim()) return 'Completá la ciudad o localidad'
    if (!c.provincia.trim()) return 'Elegí la provincia'
  }
  return null
}

export type ParsedOrder = {
  lines: { qty: number; name: string }[]
  nombre?: string
  telefono?: string
}

/** Lee un mensaje de pedido (pegado desde WhatsApp) de vuelta a datos. */
export function parseOrderMessage(text: string): ParsedOrder {
  const lines: ParsedOrder['lines'] = []
  let nombre: string | undefined
  let telefono: string | undefined
  for (const raw of text.split(/\r?\n/)) {
    // WhatsApp a veces antepone "[10:32, 7/10/2026] Juan: " al copiar.
    const line = raw.replace(/^\[[^\]]*\][^:]*:\s*/, '').trim()
    const item = line.match(/^[•*-]\s*(\d+)\s*x\s+(.+?)\s+[—–-]\s+\$/i)
    if (item) {
      lines.push({ qty: Number(item[1]), name: item[2].trim() })
      continue
    }
    const tel = line.match(/^Tel[eé]fono:\s*(.+)$/i)
    if (tel) telefono = tel[1].trim()
    const nom = line.match(/^Nombre:\s*(.+)$/i)
    if (nom) nombre = nom[1].trim()
  }
  return { lines, nombre, telefono }
}

/**
 * Normaliza un celular argentino al formato de wa.me (549 + área + número).
 * Quita el 0 del área y el 15 cuando vienen escritos de la forma habitual.
 */
export function waPhone(input: string): string | null {
  let d = input.replace(/\D/g, '')
  if (d.startsWith('549')) d = d.slice(3)
  else if (d.startsWith('54')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  // "223 15 6921670" → área + 15 + número: se quita el 15.
  const m = d.match(/^(\d{2,4})15(\d{6,8})$/)
  if (m && (m[1] + m[2]).length === 10) d = m[1] + m[2]
  return d.length === 10 ? `549${d}` : null
}
