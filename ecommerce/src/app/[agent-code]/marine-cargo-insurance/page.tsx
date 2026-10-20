import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default async function MarineCargoInsurancePage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  if (!PRODUCT_FLAGS['marine-cargo-insurance']) {
    return (
      <HoldingPage
        productSlug="marine-cargo-insurance"
        productName="Marine Cargo Insurance"
        agentCode={agentCode}
      />
    )
  }

  return (
    <HoldingPage
      productSlug="marine-cargo-insurance"
      productName="Marine Cargo Insurance"
      agentCode={agentCode}
    />
  )
}
