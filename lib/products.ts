import rawProducts from '@/data/products.json'

export type Category = 'iluminacion' | 'accesorios' | 'seguridad' | 'estetica'

export type Subcategory =
  | 'faros-barras'
  | 'kits-cree'
  | 'halogenas'
  | 'posicion'
  | 'alarmas'
  | 'tuercas'

export type Product = {
  id: string
  name: string
  price: number
  oldPrice?: number
  category: Category
  subcategory?: Subcategory
  brand: string
  image: string
  badge?: 'MÁS VENDIDO' | 'OFERTA' | 'NUEVO' | 'PREMIUM'
  rating: number
  reviews: number
  stock: number
}

export const CATEGORIES: { id: Category | 'todos'; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos', icon: 'grid' },
  { id: 'iluminacion', label: 'Iluminación', icon: 'lightbulb' },
  { id: 'accesorios', label: 'Accesorios', icon: 'package' },
  { id: 'seguridad', label: 'Seguridad', icon: 'shield' },
  { id: 'estetica', label: 'Estética', icon: 'sparkles' },
]

export const SUBCATEGORIES: { id: Subcategory; label: string; category: Category }[] = [
  { id: 'faros-barras', label: 'Faros y barras LED', category: 'iluminacion' },
  { id: 'kits-cree', label: 'Kits Cree LED', category: 'iluminacion' },
  { id: 'halogenas', label: 'Lámparas halógenas', category: 'iluminacion' },
  { id: 'posicion', label: 'Lámparas de posición LED', category: 'iluminacion' },
  { id: 'alarmas', label: 'Alarmas y cierres', category: 'seguridad' },
  { id: 'tuercas', label: 'Tuercas antirrobo y criques', category: 'seguridad' },
]

export const BRANDS = ['Iron LED', 'Kobo', 'Kube', 'Oregon', 'Philips', 'Divaio', 'Luxled']

export const BADGES = ['MÁS VENDIDO', 'OFERTA', 'NUEVO', 'PREMIUM'] as const

/** Porcentaje de descuento pagando por transferencia. */
export const TRANSFER_DISCOUNT = 0.1

export const transferPrice = (v: number) => Math.round(v * (1 - TRANSFER_DISCOUNT))

/**
 * Catálogo de la tienda. Vive en `data/products.json` y se gestiona desde
 * /admin: al guardar, el admin actualiza ese archivo (commit a GitHub en
 * producción), lo que dispara el redeploy automático en Vercel.
 */
export const PRODUCTS = rawProducts as unknown as Product[]

export const STORE = {
  name: 'AutosMix',
  address: 'Bordabehere 3111, Mar del Plata',
  whatsapp: '5492236921670',
  whatsappDisplay: '+54 9 2236 92-1670',
  /** Link opcional para quienes prefieren comprar con compra protegida. */
  mercadolibre: 'https://www.mercadolibre.com.ar/pagina/autosmix',
}

export const formatPrice = (v: number) =>
  '$' + v.toLocaleString('es-AR', { maximumFractionDigits: 0 })
