import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Email Verification',
  description: 'One Insurance',
}

export default function EmailVerificationLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
