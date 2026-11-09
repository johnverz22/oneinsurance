import type { Metadata } from 'next'
import { ProductsClient } from '@/components/products/products-client'

export const metadata: Metadata = {
  title: 'Products — One Insurance Admin Portal',
}

export default function ProductsPage() {
  return <ProductsClient />
}
