'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/admin-auth-store'

/**
 * Returns a `fetch` wrapper that automatically sets the Authorization header
 * from the Zustand auth store.  Use this for all authenticated client-side
 * API calls to the Next.js route handlers.
 *
 * A 401 response means the stored token is stale/expired — the session is
 * cleared and the user is sent back to /login instead of surfacing
 * per-table "failed to load" errors.
 *
 * Example:
 *   const authFetch = useAuthFetch()
 *   const res = await authFetch('/api/admin/statistics')
 */
export function useAuthFetch() {
  const getAuthHeader = useAdminAuthStore((s) => s.getAuthHeader)
  const logout = useAdminAuthStore((s) => s.logout)
  const router = useRouter()

  return useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const token = getAuthHeader()
      const headers = new Headers(init?.headers)
      if (token) headers.set('Authorization', token)
      const res = await fetch(input, { ...init, headers })
      if (res.status === 401) {
        logout()
        router.replace('/login')
      }
      return res
    },
    [getAuthHeader, logout, router]
  )
}
