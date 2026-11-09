import { redirect } from 'next/navigation'

import { getPersistedAgentCode } from '@/lib/agent-code-server'

export default async function RootPage() {
  redirect(`/${await getPersistedAgentCode()}`)
}
