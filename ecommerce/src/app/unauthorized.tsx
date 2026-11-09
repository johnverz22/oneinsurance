import type { Metadata } from 'next'

import { ErrorPage } from '@/components/error-page'
import { getPersistedAgentCode } from '@/lib/agent-code-server'

export const metadata: Metadata = {
  title: 'One Insurance — 401 · Authentication required',
}

export default async function Unauthorized() {
  return <ErrorPage code={401} agentCode={await getPersistedAgentCode()} />
}
