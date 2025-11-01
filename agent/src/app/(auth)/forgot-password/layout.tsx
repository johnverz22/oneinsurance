import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Forgot Password',
  description: 'One Insurance',
}

export default function ForgotPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
