import type { Metadata } from 'next'
import { SalesClient } from './sales-client'

export const metadata: Metadata = {
  title: 'Sales — UnoSure Agent Portal',
}

export default function SalesPage() {
  return <SalesClient />
}
