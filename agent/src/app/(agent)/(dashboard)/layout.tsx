'use client'

import { ProfileOverview } from '@/components/agent/profile-overview'
import { Tab, TabNavigation } from '@/components/ui/tab-navigation'
import { PageLoader } from '@/components/page-loader'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { LockedProfilePrompt } from '@/components/accounts/locked-profile-prompt'
import { useGetAccounts } from '@/app/data/queries/accounts'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAgentAuthStore()
  const { data } = useGetAccounts()

  const TABS = [
    // { value: '/', label: 'Overview' },
    { value: '/my-sales', label: 'My Sales' },
    // { value: '/team-sales', label: 'Team Sales' },
    // { value: '/overriders', label: 'Overriders' },
    { value: '/products', label: 'My Products' },
    { value: '/commissions', label: 'Commissions' },
    { value: '/referrals', label: 'Referral Links' },
    { value: '/payments', label: 'Payments' },
  ] satisfies Tab[]

  if (!user || !data) {
    return <PageLoader />
  }

  const profileState =
    user.status !== 'active'
      ? 'locked'
      : !data.hasAccounts
        ? 'incomplete'
        : null

  if (profileState) {
    return <LockedProfilePrompt state={profileState} />
  }

  return (
    <div className="relative h-full w-full space-y-6">
      <ProfileOverview />
      <TabNavigation tabs={TABS} />
      {children}
    </div>
  )
}
