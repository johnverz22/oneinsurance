import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'
import { ScrollToTop } from '@/components/scroll-to-top'

export default function MotorInsuranceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!PRODUCT_FLAGS['motor-insurance']) {
    return <HoldingPage reason="product" />
  }

  // Check if backend is explicitly offline
  if (process.env.BACKEND_OFFLINE === 'true') {
    return <HoldingPage reason="backend" />
  }
  
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  )
}
