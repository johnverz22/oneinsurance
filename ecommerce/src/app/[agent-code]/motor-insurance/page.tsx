import { HoldingPage } from '@/components/holding-page'
import { PRODUCT_FLAGS } from '@/lib/product-flags'

export default async function MotorInsurancePage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  if (!PRODUCT_FLAGS['motor-insurance']) {
    return (
      <HoldingPage
        productSlug="motor-insurance"
        productName="Motor Insurance"
        agentCode={agentCode}
      />
    )
  }

  return (
    <HoldingPage
      productSlug="motor-insurance"
      productName="Motor Insurance"
      agentCode={agentCode}
    />
  )
}
