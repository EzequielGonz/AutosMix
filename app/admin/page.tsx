'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ExternalLink,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { ShippingPanel } from './shipping-panel'
import {
  CATEGORIES,
  SUBCATEGORIES,
  BRANDS,
  BADGES,
  formatPrice,
  type Product,
} from '@/lib/products'

const EMPTY_FORM = {
  id: '',
  name: '',
  price: '',
  oldPrice: '',
  category: 'iluminacion' as Product['category'],
  subcategory: '',
  brand: 'Iron LED',
  image: '',
  badge: '',
  rating: '4.7',
  reviews: '0',
  stock: '10',
  description: '',
  weight: '',
  length: '',
  width: '',
  height: '',
}

type Status = { kind: 'idle' | 'busy' | 'ok' | 'error'; msg?: string; deployed?: boolean }

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [configured, setConfigured] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const busy = status.kind === 'busy'

  // URL de vista previa de la foto elegida (se libera al cambiarla).
  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' })
      if (res.status === 401) {
        setAuthed(false)
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({ kind: 'error', msg: data.error || 'No pude cargar los productos' })
      } else {
        setProducts(data.products || [])
      }
      setAuthed(true)
    } catch {
      setStatus({ kind: 'error', msg: 'Sin conexión con el servidor. Revisá tu internet y recargá.' })
      setAuthed((a) => (a === null ? false : a))
    }
  }, [])

  useEffect(() => {
    load()
    fetch('/api/admin/login')
      .then((r) => r.json())
      .then((d) => setConfigured(!!d.configured))
      .catch(() => {})
  }, [load])

  const login = async (e: React.FormEvent) => setAbortDefault(e, async () => {
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setPassword('')
      await load()
    } else {
      const d = await res.json().catch(() => ({}))
      setLoginError(d.error || 'No pude iniciar sesión')
    }
  })

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    setProducts([])
  }

  const resetFile = () => {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    resetFile()
  }

  const scrollToForm = () =>
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    resetFile()
    setShowForm(true)
    setStatus({ kind: 'idle' })
    scrollToForm()
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      id: p.id,
      name: p.name,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      category: p.category,
      subcategory: p.subcategory || '',
      brand: p.brand,
      image: p.image,
      badge: p.badge || '',
      rating: String(p.rating),
      reviews: String(p.reviews),
      stock: String(p.stock),
      description: p.description || '',
      weight: p.weight ? String(p.weight) : '',
      length: p.length ? String(p.length) : '',
      width: p.width ? String(p.width) : '',
      height: p.height ? String(p.height) : '',
    })
    resetFile()
    setShowForm(true)
    setStatus({ kind: 'idle' })
    scrollToForm()
  }

  const submit = async (e: React.FormEvent) =>
    setAbortDefault(e, async () => {
      if (busy) return
      const isEdit = !!editing
      setStatus({ kind: 'busy', msg: isEdit ? 'Guardando cambios…' : 'Creando producto…' })

      const product = {
        name: form.name,
        price: form.price,
        oldPrice: form.oldPrice,
        category: form.category,
        subcategory: form.subcategory,
        brand: form.brand,
        image: form.image,
        badge: form.badge,
        rating: form.rating,
        reviews: form.reviews,
        stock: form.stock,
        description: form.description,
        weight: form.weight,
        length: form.length,
        width: form.width,
        height: form.height,
      }

      // Producto + foto viajan juntos: un solo commit / un solo redeploy.
      const fd = new FormData()
      fd.append('product', JSON.stringify(product))
      if (editing) fd.append('id', editing.id)
      if (file) {
        setStatus({ kind: 'busy', msg: 'Optimizando la imagen…' })
        const optimized = await compressImage(file)
        if (optimized.size > 4 * 1024 * 1024) {
          setStatus({ kind: 'error', msg: 'La imagen es demasiado pesada (máx. 4 MB). Probá con otra.' })
          return
        }
        fd.append('file', optimized)
        setStatus({ kind: 'busy', msg: isEdit ? 'Guardando cambios…' : 'Creando producto…' })
      }

      try {
        const res = await fetch('/api/admin/products', { method: isEdit ? 'PUT' : 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          setStatus({
            kind: 'error',
            msg: data.error || (res.status === 413 ? 'La imagen es demasiado pesada' : `No pude guardar (${res.status})`),
          })
          if (res.status === 401) setAuthed(false)
          return
        }
        setProducts(data.products)
        closeForm()
        setStatus({ kind: 'ok', msg: isEdit ? 'Producto actualizado' : 'Producto creado', deployed: data.deployed })
      } catch {
        setStatus({ kind: 'error', msg: 'Se cortó la conexión mientras guardaba. Recargá la lista para ver si se guardó.' })
      }
    })

  const remove = async (p: Product) => {
    if (busy) return
    if (!confirm(`¿Borrar "${p.name}"? Esta acción no se puede deshacer.`)) return
    setStatus({ kind: 'busy', msg: 'Borrando…' })
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setStatus({ kind: 'error', msg: data.error || `No pude borrar (${res.status})` })
        if (res.status === 401) setAuthed(false)
        if (res.status === 404) load()
        return
      }
      setProducts(data.products)
      if (editing?.id === p.id) closeForm()
      setStatus({ kind: 'ok', msg: `"${p.name}" borrado`, deployed: data.deployed })
    } catch {
      setStatus({ kind: 'error', msg: 'Se cortó la conexión. Recargá la lista para ver si se borró.' })
    }
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.brand} ${p.category} ${p.id}`.toLowerCase().includes(query.toLowerCase()),
  )

  const subs = SUBCATEGORIES.filter((s) => s.category === form.category)

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center">
        <RefreshCw className="size-6 animate-spin text-white/40" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img src="/autosmix-logo-full.png" alt="AutosMix" className="mx-auto mb-4 h-12" />
            <h1 className="font-[family-name:var(--font-archivo-black)] text-xl">Administración</h1>
            <p className="mt-1 text-sm text-white/50">Acceso restringido</p>
          </div>

          {!configured ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
              Falta configurar <code className="rounded bg-black/40 px-1">ADMIN_PASSWORD</code> en las
              variables de entorno (archivo <code className="rounded bg-black/40 px-1">.env.local</code>{' '}
              local, o Settings → Environment Variables en Vercel). Después reiniciá el servidor.
            </div>
          ) : (
            <form onSubmit={login} className="space-y-3 rounded-2xl border border-line bg-panel p-5">
              <label className="block text-sm text-white/60">
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-white outline-none focus:border-brand"
                  placeholder="••••••••"
                />
              </label>
              {loginError && <p className="text-sm text-brand">{loginError}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]"
              >
                Entrar
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-xs text-white/30">
            <Link href="/" className="hover:text-white/60">← Volver a la tienda</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Barra superior */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-archivo-black)] text-2xl">Productos</h1>
          <p className="text-sm text-white/50">{products.length} productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            title="Recargar"
            className="rounded-lg border border-line bg-panel p-2.5 text-white/70 transition hover:text-white"
          >
            <RefreshCw className="size-4" />
          </button>
          <a
            href="/"
            target="_blank"
            title="Ver la tienda"
            className="rounded-lg border border-line bg-panel p-2.5 text-white/70 transition hover:text-white"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            onClick={() => setShowShipping((v) => !v)}
            title="Tarifas de envío"
            className={`flex items-center gap-1.5 rounded-lg border p-2.5 text-sm transition hover:text-white ${
              showShipping ? 'border-brand text-white' : 'border-line bg-panel text-white/70'
            }`}
          >
            <Truck className="size-4" /> <span className="hidden sm:inline">Envíos</span>
          </button>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="rounded-lg border border-line bg-panel p-2.5 text-white/70 transition hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
          <button
            onClick={openCreate}
            className="ml-1 flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold transition hover:bg-brand-600"
          >
            <Plus className="size-4" /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Estado */}
      {status.kind !== 'idle' && status.msg && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
            status.kind === 'error'
              ? 'border-brand/50 bg-brand/10 text-brand'
              : status.kind === 'ok'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-line bg-panel text-white/70'
          }`}
        >
          {status.kind === 'busy' && <RefreshCw className="mt-0.5 size-4 shrink-0 animate-spin" />}
          {status.kind === 'ok' && <Check className="mt-0.5 size-4 shrink-0" />}
          {status.kind === 'error' && <X className="mt-0.5 size-4 shrink-0" />}
          <div>
            {status.msg}
            {status.deployed && (
              <span className="block text-xs text-white/40">
                Guardado en GitHub · Vercel está desplegando los cambios (listo en ~1 min).
              </span>
            )}
          </div>
        </div>
      )}

      {showShipping && <ShippingPanel onClose={() => setShowShipping(false)} />}

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, marca, categoría o id…"
          className="w-full rounded-xl border border-line bg-panel py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-white/30 focus:border-brand"
        />
      </div>

      {/* Formulario */}
      {showForm && (
        <form ref={formRef} onSubmit={submit} className="mb-6 scroll-mt-4 rounded-2xl border border-line bg-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <button type="button" onClick={closeForm} className="text-white/40 hover:text-white">
              <X className="size-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-white/60 sm:col-span-2">
              Nombre
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
                placeholder="Kit Cree LED H4 …"
              />
            </label>

            <label className="block text-sm text-white/60 sm:col-span-2">
              Descripción (se muestra en el popup del producto)
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
                placeholder="Potencia, voltaje, compatibilidad, qué incluye el kit…"
              />
            </label>

            <label className="block text-sm text-white/60">
              Precio ($)
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
            </label>

            <label className="block text-sm text-white/60">
              Precio anterior (opcional, para el badge OFERTA)
              <input
                type="number"
                min="0"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
            </label>

            <label className="block text-sm text-white/60">
              Categoría
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Product['category'], subcategory: '' })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              >
                {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/60">
              Subcategoría (solo Iluminación y Seguridad)
              <select
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                disabled={!subs.length}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand disabled:opacity-40"
              >
                <option value="">—</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-white/60">
              Marca
              <input
                list="admin-brands"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
              <datalist id="admin-brands">
                {BRANDS.map((b) => <option key={b} value={b} />)}
              </datalist>
            </label>

            <label className="block text-sm text-white/60">
              Etiqueta
              <select
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              >
                <option value="">Sin etiqueta</option>
                {BADGES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>

            <label className="block text-sm text-white/60">
              Valoración (0–5)
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
            </label>

            <label className="block text-sm text-white/60">
              Cantidad de reseñas
              <input
                type="number"
                min="0"
                value={form.reviews}
                onChange={(e) => setForm({ ...form, reviews: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
            </label>

            <label className="block text-sm text-white/60">
              Stock
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
            </label>

            <div className="sm:col-span-2">
              <span className="block text-sm text-white/60">
                Envío Andreani (opcional · si lo dejás vacío se usa 1 kg y 20×15×10 cm)
              </span>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    ['weight', 'Peso (kg)', '0.001'],
                    ['length', 'Largo (cm)', '0.1'],
                    ['width', 'Ancho (cm)', '0.1'],
                    ['height', 'Alto (cm)', '0.1'],
                  ] as const
                ).map(([key, label, step]) => (
                  <label key={key} className="block text-xs text-white/50">
                    {label}
                    <input
                      type="number"
                      min="0"
                      step={step}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="block text-sm text-white/60">Imagen</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-black/40">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Vista previa" className="size-full object-contain" />
                  ) : form.image ? (
                    <AdminImg key={form.image} src={form.image} alt="Vista previa" />
                  ) : (
                    <span className="text-xs text-white/30">Sin foto</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/webp,image/jpeg,image/png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
                  />
                  {file ? (
                    <button type="button" onClick={resetFile} className="text-xs text-white/50 hover:text-white">
                      Descartar la foto nueva
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="…o pegá una ruta de imagen (/products/foto.webp)"
                        className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-brand"
                      />
                      {form.image && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image: '' })}
                          className="shrink-0 rounded-lg border border-line px-3 text-xs text-white/60 hover:text-white"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-white/30">WebP, JPG o PNG · se optimiza automáticamente</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold transition hover:bg-brand-600 disabled:opacity-50"
            >
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-line px-5 py-2.5 text-sm text-white/70 transition hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla de productos */}
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="divide-y divide-line">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-panel p-3 transition hover:bg-panel-2">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-black/40">
                {p.image ? (
                  <AdminImg key={p.image} src={p.image} alt="" />
                ) : (
                  <span className="text-[10px] text-white/30">s/foto</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-white/40">
                  {formatPrice(p.price)} · {p.brand} · {p.category}
                  {p.subcategory ? ` / ${p.subcategory}` : ''}
                  {p.stock > 0 ? ` · stock ${p.stock}` : ' · sin stock'}
                </p>
              </div>
              <button
                onClick={() => openEdit(p)}
                disabled={busy}
                title="Editar"
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove(p)}
                disabled={busy}
                title="Borrar"
                className="rounded-lg p-2 text-white/60 transition hover:bg-brand/10 hover:text-brand disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {!filtered.length && (
            <div className="bg-panel p-8 text-center text-sm text-white/40">Sin resultados.</div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/30">
        Los cambios se guardan en <code className="rounded bg-black/40 px-1">data/products.json</code> y la
        tienda se actualiza sola en el próximo despliegue (~1 min).
      </p>
    </div>
  )
}

/**
 * Imagen del catálogo. Si todavía no está desplegada (recién subida), la pide
 * al endpoint del admin, que la lee directo del repo.
 */
function AdminImg({ src, alt }: { src: string; alt: string }) {
  const [url, setUrl] = useState(src)
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="text-[10px] text-white/30">sin foto</span>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="size-full object-contain"
      onError={() => {
        if (url === src && src.startsWith('/products/')) setUrl(`/api/admin/image?path=${encodeURIComponent(src)}`)
        else setFailed(true)
      }}
    />
  )
}

/** Redimensiona a máx. 1600 px y convierte a WebP para que el upload sea liviano. */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85))
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

async function setAbortDefault(e: React.FormEvent, fn: () => Promise<void>) {
  e.preventDefault()
  await fn()
}
