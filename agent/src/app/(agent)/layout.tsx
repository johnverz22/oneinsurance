'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/layout/sidebar'
import { AGENT_NAVIGATIONS } from '@/constants/navigations'
import { SidebarInset } from '@/components/ui/sidebar'
import { Header } from '@/components/layout/header'
import { useIsAgentAuthenticated } from '@/store/agent-auth-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfileOverview } from '@/components/agent/profile-overview'
import { cn } from '@/lib/utils'

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname()
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
    { value: '/my-sales', label: 'My Sales', isAvailable: true },
    { value: '/team-sales', label: 'Team Sales', isAvailable: true },
    { value: '/overriders', label: 'Overriders', isAvailable: true },
    { value: '/my-products', label: 'My Products', isAvailable: false },
    { value: '/referral-links', label: 'Referral Links', isAvailable: false },
    { value: '/payments', label: 'Payments', isAvailable: false },
  ]

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

            <div className="no-visible-scrollbar bg-muted-foreground/5 relative flex w-max flex-row items-center justify-start overflow-auto rounded-full px-2 py-1.5 [perspective:1000px] sm:overflow-visible">
              {TABS.map((tab, idx) => (
                <button
                  key={tab.label}
                  onClick={() => router.push(tab.value)}
                  className="relative w-32 cursor-pointer rounded-full px-4 py-2.5 disabled:cursor-not-allowed"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  disabled={tab.isAvailable ? false : true}
                >
                  {pathname === tab.value && (
                    <motion.div
                      layoutId="clickedbutton"
                      transition={{
                        type: 'spring',
                        bounce: 0.3,
                        duration: 0.6,
                      }}
                      className="absolute inset-0 rounded-full bg-white"
                    />
                  )}

                  <span
                    className={cn('relative block', {
                      'text-blue-500': pathname === tab.value,
                    })}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {children}
          </main>
        </SidebarInset>
      </QueryClientProvider>
    </div>
  )
}
