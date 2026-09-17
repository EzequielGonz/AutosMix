'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Pantalla de carga con logo animado. Se muestra solo en la primera visita
 * de la sesión; al volver, el sitio carga instantáneo.
 */
export function Loader({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<'loading' | 'exiting' | 'done'>('loading')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const seen = sessionStorage.getItem('autosmix-loaded')
    if (seen) {
      setPhase('done')
      return
    }
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setPhase('exiting'), 2100)
    return () => clearTimeout(t1)
  }, [])

  // Salida: fade + escala, luego liberar scroll
  useEffect(() => {
    if (phase === 'exiting') {
      timer.current = setTimeout(() => {
        setPhase('done')
        sessionStorage.setItem('autosmix-loaded', '1')
        document.body.style.overflow = ''
      }, 700)
      return () => {
        if (timer.current) clearTimeout(timer.current)
      }
    }
  }, [phase])

  if (phase === 'done') return <>{children}</>

  const exiting = phase === 'exiting'

  return (
    <>
      <div
        aria-hidden={exiting}
        className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-ink transition-all duration-700 ease-out ${
          exiting ? 'pointer-events-none scale-110 opacity-0' : 'opacity-100'
        }`}
      >
        {/* Halo rojo pulsante */}
        <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[130px] animate-pulse-red" />

        <div className="relative flex flex-col items-center">
          {/* Logo */}
          <div className="animate-float">
            <img
              src="/autosmix-logo-full.png"
              alt="AutosMix"
              width={476}
              height={156}
              className="h-20 w-auto object-contain drop-shadow-[0_0_45px_rgba(225,6,0,0.5)] sm:h-28"
            />
          </div>

          {/* Barra de progreso */}
          <div className="mt-10 h-[3px] w-56 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full origin-left animate-progress rounded-full bg-gradient-to-r from-brand-700 via-brand to-[#ff4d3d]" />
          </div>

          <p className="mt-6 font-display text-xs tracking-[0.5em] text-white/50 uppercase">
            Cargando tienda
          </p>
        </div>

        {/* Rayos de luz tipo faro LED */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 flex justify-center gap-24 opacity-60">
          <div className="h-px w-40 -rotate-12 bg-gradient-to-r from-transparent via-brand/60 to-transparent animate-beam" />
          <div className="h-px w-40 rotate-12 bg-gradient-to-r from-transparent via-brand/60 to-transparent animate-beam-late" />
        </div>
      </div>

      <div className={exiting ? 'animate-fade-in duration-700' : 'invisible'}>{children}</div>
    </>
  )
}
