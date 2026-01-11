import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Generate Report',
  description: 'One Insurance',
}

export default function GenerateReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
