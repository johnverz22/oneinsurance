'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const { user, logout } = useAgentAuthStore()
  const { data, isLoading, isError, error } = useGetAccounts()

  const TABS = [
    // { value: '/', label: 'Overview' },
    { value: '/my-sales', label: 'My Sales' },
    // { value: '/team-sales', label: 'Team Sales' },
    // { value: '/overriders', label: 'Overriders' },
    { value: '/products', label: 'My Products' },
    { value: '/referrals', label: 'Referral Links' },
    { value: '/commissions', label: 'Commissions' },
    { value: '/policies', label: 'Policy' },
  ] satisfies Tab[]

  // Handle authentication errors
  useEffect(() => {
    if (isError && error) {
      // Check if it's an authentication error (401)
      const axiosError = error as any
      if (
        axiosError?.response?.status === 401 ||
        axiosError?.message?.includes('Unauthorized')
      ) {
        // Token is invalid or expired, logout and redirect
        logout()
        router.push('/login')
      }
    }
  }, [isError, error, logout, router])

  if (!user || isLoading) {
    return <PageLoader />
  }

  // If there's an error and it's not a 401, show error state
  if (isError) {
    return <PageLoader />
  }

  if (!data) {
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
