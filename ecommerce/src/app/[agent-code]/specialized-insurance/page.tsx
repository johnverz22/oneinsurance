import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default async function SpecializedInsurancePage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  if (!PRODUCT_FLAGS['specialized-insurance']) {
    return (
      <HoldingPage
        productSlug="specialized-insurance"
        productName="Mandatory and Specialized Insurance Coverage"
        agentCode={agentCode}
      />
    )
  }

  return (
    <HoldingPage
      productSlug="specialized-insurance"
      productName="Mandatory and Specialized Insurance Coverage"
      agentCode={agentCode}
    />
  )
}
