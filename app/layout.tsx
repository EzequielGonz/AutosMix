import type { Metadata, Viewport } from 'next'
import { Archivo_Black, Inter } from 'next/font/google'
import './globals.css'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AutosMix · Iluminación LED y Accesorios para Vehículos | Mar del Plata',
  description:
    'AutosMix — Especialistas en iluminación LED 12/24V, accesorios, alarmas, cierres centralizados y estética vehicular. Bordabehere 3111, Mar del Plata. Envíos a todo el país.',
  keywords: [
    'AutosMix',
    'LED autos',
    'faros LED',
    'Mar del Plata',
    'accesorios vehiculares',
    'alarmas autos',
    'cierres centralizados',
  ],
  openGraph: {
    title: 'AutosMix · Iluminación LED y Accesorios',
    description:
      'Iluminación LED 12/24V, accesorios, alarmas y estética vehicular. Bordabehere 3111, Mar del Plata.',
    type: 'website',
    locale: 'es_AR',
  },
}

export const viewport: Viewport = {
  themeColor: '#e10600',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${archivoBlack.variable} ${inter.variable}`}>
      <body className="bg-ink text-white antialiased">{children}</body>
    </html>
  )
}
