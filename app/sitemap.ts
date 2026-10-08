import type { MetadataRoute } from 'next'
import { PRODUCTS, SITE_URL, productPath } from '@/lib/products'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    ...PRODUCTS.map((p) => ({ url: `${SITE_URL}${productPath(p)}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
