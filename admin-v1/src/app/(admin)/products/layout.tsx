import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Products & LOB',
  description: 'One Insurance',
}

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
