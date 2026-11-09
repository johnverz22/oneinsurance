import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Quotations',
  description: 'One Insurance',
}

export default function QuotationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
