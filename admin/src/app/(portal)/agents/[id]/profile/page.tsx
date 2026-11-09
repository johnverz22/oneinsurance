import type { Metadata } from 'next'
import { AgentProfileClient } from '@/components/agents/agent-profile-client'

export const metadata: Metadata = {
  title: 'Agent profile — One Insurance Admin Portal',
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AgentProfileClient agentId={Number(id)} />
}
