import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Applicants',
  description: 'One Insurance',
}

export default function ApplicantsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}