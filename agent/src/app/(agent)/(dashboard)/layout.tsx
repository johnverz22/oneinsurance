'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileOverview } from '@/components/agent/profile-overview'
import { Tab, TabNavigation } from '@/components/ui/tab-navigation'
import { PageLoader } from '@/components/page-loader'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { LockedProfilePrompt } from '@/components/accounts/locked-profile-prompt'
import { useGetAccounts } from '@/app/data/queries/accounts'
import ServerOffline from '@/components/server-offline'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, logout } = useAgentAuthStore()
  const { data, isLoading, isError, error, refetch } = useGetAccounts()

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

  // If there's an error and it's not a 401, show server offline error
  if (isError) {
    const axiosError = error as any
    // Only show server offline for non-auth errors
    if (axiosError?.response?.status !== 401 && !axiosError?.message?.includes('Unauthorized')) {
      return <ServerOffline onRefresh={() => refetch()} />
    }
    // For auth errors, show loader while redirecting
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Agent'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your sales, products, commissions, and policies from your dashboard.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Active
          </span>
          <span className="text-xs">{user?.role || 'Agent'}</span>
        </div>
      </div>
      <TabNavigation tabs={TABS} />
      {children}
    </div>
  )
}
