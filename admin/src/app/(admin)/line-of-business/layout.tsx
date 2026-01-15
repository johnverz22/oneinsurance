import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Line of Business',
  description: 'One Insurance',
}

export default function LineOfBusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
