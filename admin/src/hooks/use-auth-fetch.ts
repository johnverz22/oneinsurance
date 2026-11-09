'use client'

import { useCallback } from 'react'
import { useAdminAuthStore } from '@/store/admin-auth-store'

/**
 * Returns a `fetch` wrapper that automatically sets the Authorization header
 * from the Zustand auth store.  Use this for all authenticated client-side
 * API calls to the Next.js route handlers.
 *
 * Example:
 *   const authFetch = useAuthFetch()
 *   const res = await authFetch('/api/admin/statistics')
 */
export function useAuthFetch() {
  const getAuthHeader = useAdminAuthStore((s) => s.getAuthHeader)

  return useCallback(
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const token = getAuthHeader()
      const headers = new Headers(init?.headers)
      if (token) headers.set('Authorization', token)
      return fetch(input, { ...init, headers })
    },
    [getAuthHeader]
  )
}
