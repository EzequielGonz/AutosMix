import { StoreProvider } from '@/components/store-context'
import { Loader } from '@/components/loader'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { Catalog } from '@/components/catalog'
import { Categories } from '@/components/categories'
import { Brands } from '@/components/brands'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { CartToast } from '@/components/cart-toast'
import { WhatsAppButton } from '@/components/whatsapp-button'

export default function Home() {
  return (
    <StoreProvider>
      <Loader>
        <Header />

        <main>
          <Hero />
          {/* Catálogo completo: todos los productos visibles justo después del hero */}
          <Catalog />
          <Categories />
          <Brands />
        </main>

        <Footer />

        {/* Overlays */}
        <CartDrawer />
        <CartToast />
        <WhatsAppButton />
      </Loader>
    </StoreProvider>
  )
}
