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
  X,
} from 'lucide-react'
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
  const [form, setForm] = useState(EMPTY_FORM)
  const fileRef = useRef<HTMLInputElement>(null)
  const [deployInfo, setDeployInfo] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/products', { cache: 'no-store' })
    if (res.status === 401) {
      setAuthed(false)
      return
    }
    const data = await res.json()
    setProducts(data.products || [])
    setAuthed(true)
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

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setStatus({ kind: 'idle' })
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
    })
    setShowForm(true)
    setStatus({ kind: 'idle' })
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      setStatus({ kind: 'error', msg: data.error || 'No pude subir la imagen' })
      return null
    }
    return data.path
  }

  const submit = async (e: React.FormEvent) =>
    setAbortDefault(e, async () => {
      setStatus({ kind: 'busy', msg: editing ? 'Guardando cambios…' : 'Creando producto…' })

      // Imagen nueva elegida en el formulario.
      const file = fileRef.current?.files?.[0]
      let imagePath = form.image
      if (file) {
        const uploaded = await uploadImage(file)
        if (!uploaded) return
        imagePath = uploaded
      }

      const product = {
        id: form.id || undefined,
        name: form.name,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        category: form.category,
        subcategory: form.subcategory || undefined,
        brand: form.brand,
        image: imagePath,
        badge: form.badge || undefined,
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        stock: Number(form.stock),
        description: form.description || undefined,
      }

      const res = await fetch('/api/admin/products', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, product } : { product }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.ok) {
        setStatus({ kind: 'error', msg: data.error || 'No pude guardar' })
        return
      }

      setProducts(data.products)
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      if (fileRef.current) fileRef.current.value = ''
      setStatus({ kind: 'ok', msg: editing ? 'Producto actualizado' : 'Producto creado', deployed: data.deployed })
    })

  const remove = async (p: Product) => {
    if (!confirm(`¿Borrar "${p.name}"? Esta acción no se puede deshacer.`)) return
    setStatus({ kind: 'busy', msg: 'Borrando…' })
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      setStatus({ kind: 'error', msg: data.error || 'No pude borrar' })
      return
    }
    setProducts(data.products)
    setStatus({ kind: 'ok', msg: `"${p.name}" borrado`, deployed: data.deployed })
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
      {deployInfo && <p className="mb-4 text-xs text-white/40">{deployInfo}</p>}

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
        <form onSubmit={submit} className="mb-6 rounded-2xl border border-line bg-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
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
              <span className="block text-sm text-white/60">Imagen</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-black/40">
                  {form.image || fileRef.current?.files?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        fileRef.current?.files?.[0]
                          ? URL.createObjectURL(fileRef.current.files[0])
                          : form.image
                      }
                      alt="Vista previa"
                      className="size-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-white/30">Sin foto</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/webp,image/jpeg,image/png"
                    onChange={() => setForm({ ...form })}
                    className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600"
                  />
                  <input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="…o pegá una ruta de imagen (/products/foto.webp)"
                    className="w-full rounded-lg border border-line bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-brand"
                  />
                  <p className="text-xs text-white/30">WebP, JPG o PNG · hasta 5 MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={status.kind === 'busy'}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold transition hover:bg-brand-600 disabled:opacity-50"
            >
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="size-full object-contain" />
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
                title="Editar"
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove(p)}
                title="Borrar"
                className="rounded-lg p-2 text-white/60 transition hover:bg-brand/10 hover:text-brand"
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
        tienda se actualiza sola en el próximo despliegue.
      </p>
    </div>
  )
}

async function setAbortDefault(e: React.FormEvent, fn: () => Promise<void>) {
  e.preventDefault()
  await fn()
}
