'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/layout/sidebar'
import { AGENT_NAVIGATIONS } from '@/constants/navigations'
import { SidebarInset } from '@/components/ui/sidebar'
import { Header } from '@/components/layout/header'
import { useIsAgentAuthenticated } from '@/store/agent-auth-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

  return (
    <div className="flex">
      <QueryClientProvider client={queryClient}>
        <div className="h-full w-max">
          <Header
            isLoggedIn={true}
            isNavigationVisible={false}
            contentContainerClassName="max-w-screen"
          />
          <AppSidebar
            navigations={AGENT_NAVIGATIONS}
            className="top-20"
            isBrandVisible={false}
          />
        </div>

        <SidebarInset>
          <main className="mx-auto h-full min-h-screen w-full bg-gray-100 p-4 pt-28 lg:px-8 lg:pl-20 dark:bg-gray-950">
            {children}
          </main>
        </SidebarInset>
      </QueryClientProvider>
    </div>
  )
}
