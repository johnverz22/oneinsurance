import { HoldingPage } from '@/components/holding-page'
import { getPersistedAgentCode } from '@/lib/agent-code-server'

export default async function RootComingSoonPage() {
  return (
    <HoldingPage
      productSlug="coming-soon"
      productName="New Insurance Products"
      agentCode={await getPersistedAgentCode()}
    />
  )
}
