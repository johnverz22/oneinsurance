import type { Metadata } from 'next'
import { AgentCasesClient } from '@/components/agents/agent-cases-client'

export const metadata: Metadata = {
  title: 'Agent cases — One Insurance Admin Portal',
}

export default async function AgentCasesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AgentCasesClient agentId={Number(id)} />
}
