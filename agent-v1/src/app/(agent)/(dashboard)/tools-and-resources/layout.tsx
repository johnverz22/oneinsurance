import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Tools & Resources',
  description: 'One Insurance',
}

export default function ToolsResourcesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
