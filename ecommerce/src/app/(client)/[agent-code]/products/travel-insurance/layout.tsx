import type { Metadata } from 'next'
import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export const metadata: Metadata = {
  title: 'One Insurance | Travel Insurance',
  description: 'One Insurance',
}

export default async function TravelInsuranceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Check if product is disabled
  if (!PRODUCT_FLAGS['travel-insurance']) {
    return <HoldingPage reason="product" />
  }

  // Check if backend is explicitly offline
  if (process.env.BACKEND_OFFLINE === 'true') {
    return <HoldingPage reason="backend" />
  }

  return <>{children}</>
}
