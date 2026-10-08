import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { CATEGORY_LABELS, PRODUCTS, SITE_URL, STORE, productPath } from '@/lib/products'
import { StoreProvider } from '@/components/store-context'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { CartToast } from '@/components/cart-toast'
import { ProductModal } from '@/components/product-modal'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { ProductCard } from '@/components/product-card'
import { ProductDetail } from '@/components/product-detail'

type Params = { params: Promise<{ id: string }> }

const find = (id: string) => PRODUCTS.find((p) => p.id === decodeURIComponent(id))

/** Una página estática por producto (se regenera en cada deploy del admin). */
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }))
}

export const dynamicParams = false

const summary = (text = '') => {
  const clean = text.replace(/\*+/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > 155 ? clean.slice(0, 152).trimEnd() + '…' : clean
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = find((await params).id)
  if (!p) return {}
  const description =
    summary(p.description) || `${p.name} · ${p.brand}. Envíos a todo el país por Andreani desde Mar del Plata.`
  return {
    title: `${p.name} | AutosMix`,
    description,
    alternates: { canonical: productPath(p) },
    openGraph: {
      title: p.name,
      description,
      type: 'website',
      locale: 'es_AR',
      url: productPath(p),
      images: p.image ? [{ url: p.image, alt: p.name }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Params) {
  const p = find((await params).id)
  if (!p) notFound()

  const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4)

  // Datos estructurados para que Google muestre precio y stock.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.image ? `${SITE_URL}${p.image}` : undefined,
    description: summary(p.description) || undefined,
    brand: { '@type': 'Brand', name: p.brand },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}${productPath(p)}`,
      priceCurrency: 'ARS',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: STORE.name },
    },
  }

  return (
    <StoreProvider>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <nav aria-label="Ubicación" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-white/45">
          <Link href="/" className="hover:text-white">
            Inicio
          </Link>
          <ChevronRight className="size-3.5" />
          <a href={`/?cat=${p.category}#productos`} className="hover:text-white">
            {CATEGORY_LABELS[p.category] ?? p.category}
          </a>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 text-white/70">{p.name}</span>
        </nav>

        <article className="overflow-hidden rounded-3xl border border-line bg-panel">
          <ProductDetail product={p} titleAs="h1" />
        </article>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl uppercase">
              También te puede <span className="text-brand">interesar</span>
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((r, i) => (
                <ProductCard key={r.id} product={r} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <CartToast />
      <ProductModal />
      <WhatsAppButton />
    </StoreProvider>
  )
}
