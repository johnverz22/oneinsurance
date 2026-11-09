import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Sign Up',
  description: 'One Insurance',
}

export default function SignUpLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
