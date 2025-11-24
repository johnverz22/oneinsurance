'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAgentAuthenticated } from '@/store/agent-auth-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfileOverview } from '@/components/agent/profile-overview'
import { Tab, TabNavigation } from '@/components/ui/tab-navigation'
import { SidebarInset } from '@/components/ui/sidebar'
import { Header } from '@/components/layout/header'

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const isAuthenticated = useIsAgentAuthenticated()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    document.title = 'One Insurance | Agent Dashboard'
  }, [])

  useEffect(() => {
    // Check if agent is authenticated
    if (!isAuthenticated && hydrated) {
      // Redirect to login page if not authenticated
      router.push('/login')
      return
    }
  }, [isAuthenticated, router, hydrated])

  // Don't render the layout if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  const queryClient = new QueryClient()

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
    <div className="flex">
      <QueryClientProvider client={queryClient}>
        <div className="h-full w-max">
          <Header
            isLoggedIn={true}
            isNavigationVisible={false}
            contentContainerClassName="max-w-screen"
          />
        </div>

        <SidebarInset>
          <main className="bg-background max-w-app mx-auto h-full min-h-screen w-full space-y-6 p-4 pt-28 lg:px-8">
            <ProfileOverview />
            <TabNavigation tabs={TABS} />

            {children}
          </main>
        </SidebarInset>
      </QueryClientProvider>
    </div>
  )
}
