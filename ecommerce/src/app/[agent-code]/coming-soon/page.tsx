import { HoldingPage } from '@/components/holding-page'

export default async function GenericComingSoonPage({
  params,
}: {
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  return (
    <HoldingPage
      productSlug="coming-soon"
      productName="New Insurance Products"
      agentCode={agentCode}
    />
  )
}
