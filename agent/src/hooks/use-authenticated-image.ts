'use client'

import { useEffect, useState } from 'react'
import { useAgentAuthStore } from '@/store/agent-auth-store'

/**
 * Fetches an image URL that requires an Authorization header and returns a
 * temporary blob object URL suitable for use in <img src={...}>.
 *
 * Use this for any image served through an authenticated proxy route
 * (e.g. /api/agent/files/[id]/serve) — browsers cannot send Authorization
 * headers from plain <img src="..."> tags.
 *
 * The blob URL is revoked automatically when the component unmounts or when
 * the source URL changes.
 *
 * @param src  - The authenticated image URL, or null/undefined to skip.
 * @returns      A blob: URL string while loading succeeds, or null otherwise.
 *
 * @example
 *   const blobUrl = useAuthenticatedImage(user?.profile_photo_url)
 *   return blobUrl ? <img src={blobUrl} /> : <FallbackAvatar />
 */
export function useAuthenticatedImage(src: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const getAuthHeader = useAgentAuthStore((s) => s.getAuthHeader)

  useEffect(() => {
    if (!src) {
      setBlobUrl(null)
      return
    }

    // Plain external URLs (http/https not going through our proxy) can be used
    // directly — no auth header needed.
    const isProxyRoute = src.startsWith('/api/')
    if (!isProxyRoute) {
      setBlobUrl(src)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    async function load() {
      const token = getAuthHeader()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = token

      try {
        const res = await fetch(src!, { headers })
        if (!res.ok || cancelled) return

        const blob = await res.blob()
        if (cancelled) return

        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      } catch {
        // Network error or auth failure — leave blobUrl as null so the
        // caller can render a fallback avatar.
        if (!cancelled) setBlobUrl(null)
      }
    }

    setBlobUrl(null) // clear stale URL while new one loads
    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, getAuthHeader])

  return blobUrl
}
