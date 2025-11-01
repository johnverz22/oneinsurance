import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Verify Email',
  description: 'One Insurance',
}

export default function VerifyEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
