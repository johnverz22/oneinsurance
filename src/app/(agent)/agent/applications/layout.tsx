import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Applications',
  description: 'One Insurance',
}

export default function ApplicationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
