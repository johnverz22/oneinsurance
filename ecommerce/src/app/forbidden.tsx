import type { Metadata } from 'next'

import { ErrorPage } from '@/components/error-page'
import { getPersistedAgentCode } from '@/lib/agent-code-server'

export const metadata: Metadata = {
  title: 'One Insurance — 403 · Access denied',
}

export default async function Forbidden() {
  return <ErrorPage code={403} agentCode={await getPersistedAgentCode()} />
}
