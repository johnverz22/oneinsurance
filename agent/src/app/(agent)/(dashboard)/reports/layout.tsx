import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Reports',
  description: 'One Insurance',
}

export default function ReportsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
