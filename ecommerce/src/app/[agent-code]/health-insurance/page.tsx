import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default async function HealthInsurancePage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  if (!PRODUCT_FLAGS['health-insurance']) {
    return (
      <HoldingPage
        productSlug="health-insurance"
        productName="Health Insurance"
        agentCode={agentCode}
      />
    )
  }

  return (
    <HoldingPage
      productSlug="health-insurance"
      productName="Health Insurance"
      agentCode={agentCode}
    />
  )
}
