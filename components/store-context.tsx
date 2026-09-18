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
import type { Category, Product, Subcategory } from '@/lib/products'

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
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setCartOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'todos'>('todos')
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar carrito guardado
  useEffect(() => {
    try {
      const raw = localStorage.getItem('autosmix-cart')
      if (raw) setItems(JSON.parse(raw))
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
          i.product.id === p.id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i,
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
        : prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

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
    }),
    [items, count, total, isCartOpen, add, remove, setQty, clear, lastAdded, search, category, subcategory],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
