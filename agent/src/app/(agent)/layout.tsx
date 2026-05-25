'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAgentAuthenticated } from '@/store/agent-auth-store'
import { SidebarInset } from '@/components/ui/sidebar'
import { Header } from '@/components/layout/header'
import { AGENT_NAVIGATIONS } from '@/constants/navigations'

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

  return (
    <div className="flex h-full w-full">
      <Header
        isLoggedIn={isAuthenticated}
        isNavigationVisible={true}
        navigations={AGENT_NAVIGATIONS}
        contentContainerClassName="max-w-screen"
      />

      <SidebarInset>
        <main className="bg-background mx-auto h-full min-h-screen w-full p-4 pt-28 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </div>
  )
}
