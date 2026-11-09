import type { Metadata } from 'next'
import { SalesClient } from './sales-client'

export const metadata: Metadata = {
  title: 'My Sales — One Insurance Agent Portal',
}

export default function SalesPage() {
  return <SalesClient />
}
