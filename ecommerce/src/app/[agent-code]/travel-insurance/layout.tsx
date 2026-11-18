import { Footer } from '@/components/layout/footer'
import { resolveAgentCode } from '@/lib/agent-code'

export default async function TravelInsuranceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'agent-code': string }>
}) {
  const { 'agent-code': rawAgentCode } = await params
  const agentCode = resolveAgentCode(rawAgentCode)

  return (
    <div className="flex min-h-dvh flex-col bg-[#fcfdfb] text-[var(--text-main)] dark:bg-[#1c1e1e] dark:text-[var(--text-main)]">
      <div className="flex-1 flex w-full min-w-0 flex-col [&>*]:w-full [&>*]:min-w-0">{children}</div>
      <Footer agentCode={agentCode} />
    </div>
  )
}

