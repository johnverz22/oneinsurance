import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Client Management',
  description: 'One Insurance',
}

export default function ClientManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
