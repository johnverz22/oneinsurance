import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Product Management',
  description: 'One Insurance',
}

export default function AgentProductManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}
