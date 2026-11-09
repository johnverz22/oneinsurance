'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAuthenticated, useHasHydrated } from '@/store/agent-auth-store'
import { AuthLayout } from '@/components/auth/auth-layout'

/**
 * Auth route group layout.
 * Redirects already-authenticated users directly to the dashboard.
 * Waits for Zustand hydration before redirecting to prevent flash.
 */
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = useIsAuthenticated()
  const hasHydrated = useHasHydrated()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [hasHydrated, isAuthenticated, router])

  return <AuthLayout>{children}</AuthLayout>
}
