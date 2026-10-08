'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { PRODUCTS, productPath, type Category, type Product, type Subcategory } from '@/lib/products'

export type CartItem = { product: Product; qty: number }

type StoreContextType = {
  // Carrito
  items: CartItem[]
  count: number
  total: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  add: (p: Product) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  lastAdded: Product | null
  // Búsqueda y categoría
  search: string
  setSearch: (v: string) => void
  category: Category | 'todos'
  setCategory: (c: Category | 'todos') => void
  subcategory: Subcategory | null
  setSubcategory: (s: Subcategory | null) => void
  // Popup de detalle de producto
  modalProduct: Product | null
  openProduct: (p: Product) => void
  closeModal: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setCartOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'todos'>('todos')
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar carrito guardado. Cada item se re-sincroniza con el catálogo
  // actual: si el admin cambió precio/foto/stock se toma lo nuevo, y si borró
  // el producto se descarta.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('autosmix-cart')
      if (!raw) return
      const parsed: CartItem[] = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const byId = new Map(PRODUCTS.map((p) => [p.id, p]))
      setItems(
        parsed.flatMap((i) => {
          const product = i?.product?.id ? byId.get(i.product.id) : undefined
          const qty = Math.round(Number(i?.qty))
          if (!product || !(qty > 0)) return []
          return [{ product, qty: product.stock > 0 ? Math.min(qty, product.stock) : qty }]
        }),
      )
    } catch {
      /* carrito corrupto: se ignora */
    }
  }, [])

  // Persistir carrito
  useEffect(() => {
    try {
      localStorage.setItem('autosmix-cart', JSON.stringify(items))
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [items])

  const add = useCallback((p: Product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === p.id)
      if (found) {
        return prev.map((i) =>
          i.product.id === p.id ? { ...i, qty: p.stock > 0 ? Math.min(i.qty + 1, p.stock) : i.qty + 1 } : i,
        )
      }
      return [...prev, { product: p, qty: 1 }]
    })
    setLastAdded(p)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setLastAdded(null), 3000)
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== id))
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product.id !== id)
        : prev.map((i) =>
            i.product.id === id ? { ...i, qty: i.product.stock > 0 ? Math.min(qty, i.product.stock) : qty } : i,
          ),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  // Búsqueda o categoría que llegan por la URL (?q= / ?cat=) desde otra página.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const cat = params.get('cat')
    if (q) setSearch(q)
    if (cat && ['iluminacion', 'accesorios', 'seguridad', 'estetica'].includes(cat)) setCategory(cat as Category)
  }, [])

  // Popup de producto con URL propia: al abrirlo la barra pasa a
  // /producto/[id] (se puede copiar y compartir) y "atrás" lo cierra.
  const openProduct = useCallback((p: Product) => {
    setModalProduct(p)
    const path = productPath(p)
    if (window.location.pathname !== path) {
      const state = { ...(window.history.state || {}), amModal: p.id }
      if (window.history.state?.amModal) window.history.replaceState(state, '', path)
      else window.history.pushState(state, '', path)
    }
  }, [])

  const closeModal = useCallback(() => {
    if (window.history.state?.amModal) window.history.back()
    else setModalProduct(null)
  }, [])

  useEffect(() => {
    const onPop = () => {
      const id = window.history.state?.amModal
      setModalProduct(id ? PRODUCTS.find((p) => p.id === id) || null : null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const { count, total } = useMemo(
    () => ({
      count: items.reduce((acc, i) => acc + i.qty, 0),
      total: items.reduce((acc, i) => acc + i.qty * i.product.price, 0),
    }),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      isCartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      add,
      remove,
      setQty,
      clear,
      lastAdded,
      search,
      setSearch,
      category,
      setCategory,
      subcategory,
      setSubcategory,
      modalProduct,
      openProduct,
      closeModal,
    }),
    [items, count, total, isCartOpen, add, remove, setQty, clear, lastAdded, search, category, subcategory, modalProduct, openProduct, closeModal],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
