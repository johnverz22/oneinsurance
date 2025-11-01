import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Contact',
  description: 'One Insurance',
}

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
