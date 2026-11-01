import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PaymentResult } from './payment-result'

export const metadata: Metadata = { title: 'Pago · AutosMix', robots: { index: false } }

const ESTADOS = ['exito', 'pendiente', 'error'] as const
export type Estado = (typeof ESTADOS)[number]

export default async function PagoPage({ params }: { params: Promise<{ estado: string }> }) {
  const { estado } = await params
  if (!ESTADOS.includes(estado as Estado)) notFound()
  return <PaymentResult estado={estado as Estado} />
}
