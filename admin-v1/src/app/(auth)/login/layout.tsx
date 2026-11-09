import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Admin Login',
  description: 'One Insurance',
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
