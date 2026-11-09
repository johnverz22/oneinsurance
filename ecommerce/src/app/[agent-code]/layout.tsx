import { AgentCodeSync } from '@/components/agent-code-sync'

export default async function AgentCodeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': agentCode } = await params

  return (
    <>
      <AgentCodeSync agentCode={agentCode} />
      {children}
    </>
  )
}
