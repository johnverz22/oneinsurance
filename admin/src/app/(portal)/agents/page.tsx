import type { Metadata } from 'next'
import { AgentsClient } from '@/components/agents/agents-client'

export const metadata: Metadata = {
  title: 'Agents — One Insurance Admin Portal',
}

export default function AgentsPage() {
  return <AgentsClient />
}
