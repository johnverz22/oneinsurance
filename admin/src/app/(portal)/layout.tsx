'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated, useHasHydrated } from '@/store/admin-auth-store'
import { PortalLayout } from '@/components/layout/portal-layout'

/**
 * Route group layout for all authenticated portal pages.
 * Waits for Zustand hydration before checking auth to prevent
 * flash-to-login on first load.
 */
export default function PortalGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = useIsAuthenticated()
  const hasHydrated = useHasHydrated()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace('/login')
    }
  }, [hasHydrated, isAuthenticated, router])

  // Show nothing until store is hydrated to prevent flash
  if (!hasHydrated) return null
  if (!isAuthenticated) return null

  return <PortalLayout>{children}</PortalLayout>
}
