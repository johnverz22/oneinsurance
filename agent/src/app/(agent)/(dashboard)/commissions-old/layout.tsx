import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Commissions',
  description: 'One Insurance',
}

export default function CommissionsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
