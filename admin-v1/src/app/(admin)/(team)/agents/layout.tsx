import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agents',
  description: 'One Insurance',
}

export default function AgentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
