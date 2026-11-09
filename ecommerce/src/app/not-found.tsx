import type { Metadata } from 'next'

import { ErrorPage } from '@/components/error-page'
import { getPersistedAgentCode } from '@/lib/agent-code-server'

export const metadata: Metadata = {
  title: 'One Insurance — 404 · Page not found',
}

export default async function NotFound() {
  return <ErrorPage code={404} agentCode={await getPersistedAgentCode()} />
}
