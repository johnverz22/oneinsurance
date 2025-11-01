import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Transactions',
  description: 'One Insurance',
}

export default function TransactionsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
