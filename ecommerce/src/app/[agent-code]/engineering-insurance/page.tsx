import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default async function EngineeringInsurancePage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  if (!PRODUCT_FLAGS['engineering-insurance']) {
    return (
      <HoldingPage
        productSlug="engineering-insurance"
        productName="Engineering Insurance"
        agentCode={agentCode}
      />
    )
  }

  return (
    <HoldingPage
      productSlug="engineering-insurance"
      productName="Engineering Insurance"
      agentCode={agentCode}
    />
  )
}
