import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Travel Insurance',
  description: 'One Insurance',
}

export default function TravelInsuranceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
