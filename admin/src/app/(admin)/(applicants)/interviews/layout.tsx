import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Interviews',
  description: 'One Insurance',
}

export default function InterviewsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}