'use client'

import { useRouter } from 'next/navigation'
import { ProfileOverview } from '@/components/agent/profile-overview'
import { Tab, TabNavigation } from '@/components/ui/tab-navigation'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()

  const TABS = [
    { value: '/', label: 'Overview' },
    { value: '/my-sales', label: 'My Sales' },
    { value: '/team-sales', label: 'Team Sales' },
    { value: '/overriders', label: 'Overriders' },
    { value: '/products', label: 'My Products' },
    { value: '/referrals', label: 'Referral Links' },
    { value: '/payments', label: 'Payments' },
  ] satisfies Tab[]

  return (
    <div className="relative h-full w-full space-y-6">
      <ProfileOverview />
      <TabNavigation tabs={TABS} />

      {children}
    </div>
  )
}
