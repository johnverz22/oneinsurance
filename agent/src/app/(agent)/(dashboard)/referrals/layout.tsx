import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Referrals',
  description: 'One Insurance',
}

export default function ReferralsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
