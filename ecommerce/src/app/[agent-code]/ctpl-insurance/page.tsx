import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default async function CtplInsurancePage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  if (!PRODUCT_FLAGS['ctpl-insurance']) {
    return (
      <HoldingPage
        productSlug="ctpl-insurance"
        productName="CTPL Insurance"
        agentCode={agentCode}
      />
    )
  }

  return (
    <HoldingPage
      productSlug="ctpl-insurance"
      productName="CTPL Insurance"
      agentCode={agentCode}
    />
  )
}
