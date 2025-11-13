import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Dashboard',
  description: 'One Insurance',
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
