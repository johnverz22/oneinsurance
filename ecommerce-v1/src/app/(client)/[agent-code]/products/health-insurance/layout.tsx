import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default function HealthInsuranceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!PRODUCT_FLAGS['health-insurance']) {
    return <HoldingPage reason="product" />
  }

  if (process.env.BACKEND_OFFLINE === 'true') {
    return <HoldingPage reason="backend" />
  }
  
  return <>{children}</>
}
