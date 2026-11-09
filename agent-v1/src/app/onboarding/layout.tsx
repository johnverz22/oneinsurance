import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'One Insurance | Agent Onboarding',
  description: 'One Insurance',
}

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
