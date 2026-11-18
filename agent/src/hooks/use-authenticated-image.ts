'use client'

import { useEffect, useRef, useState } from 'react'
import { useAgentAuthStore } from '@/store/agent-auth-store'

/**
 * Fetches an image URL that requires an Authorization header and returns a
 * temporary blob object URL suitable for use in <img src={...}>.
 *
 * Use this for any image served through an authenticated proxy route
 * (e.g. /api/agent/profile/photo or /api/agent/files/[id]/serve) — browsers
 * cannot send Authorization headers from plain <img src="..."> tags.
 *
 * Also handles backend absolute URLs (e.g. https://stage-api.…/agents/profile-photo)
 * by fetching them server-side via our proxy instead of directly, since those
 * endpoints also require a bearer token.
 *
 * The blob URL is revoked automatically when the component unmounts or when
 * the source URL changes.
 *
 * @param src  - The authenticated image URL, or null/undefined to skip.
 * @returns      A blob: URL string while loading succeeds, or null otherwise.
 *
 * @example
 *   const blobUrl = useAuthenticatedImage(user?.profile_photo?.url)
 *   return blobUrl ? <img src={blobUrl} /> : <FallbackAvatar />
 */
export function useAuthenticatedImage(src: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const getAuthHeader = useAgentAuthStore((s) => s.getAuthHeader)

  // Incremented on every mount so the effect always re-fires even when `src`
  // hasn't changed. Blob URLs are revoked on cleanup and do not survive a
  // remount, so we must always start a fresh fetch.
  const mountCount = useRef(0)
  useEffect(() => {
    mountCount.current += 1
  }, [])

  useEffect(() => {
    if (!src) {
      setBlobUrl(null)
      return
    }

    // Determine which URL to actually fetch:
    // - Local proxy routes (/api/…) → fetch directly with auth header
    // - Backend absolute URLs that contain /agents/profile-photo → redirect
    //   through our local proxy so the token stays server-side
    // - Any other external URL (e.g. a plain CDN) → use directly, no auth
    let fetchUrl: string

    if (src.startsWith('/api/')) {
      fetchUrl = src
    } else if (src.includes('/agents/profile-photo')) {
      // Backend leaked an absolute URL — route it through our proxy instead
      const qs = src.includes('?') ? src.slice(src.indexOf('?')) : ''
      fetchUrl = `/api/agent/profile/photo${qs}`
    } else {
      // Plain public URL — use as-is, no auth header needed
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
        const res = await fetch(fetchUrl, { headers })
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

    setBlobUrl(null)
    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  // mountCount.current is intentionally included so this effect re-runs on
  // every mount (not just when src changes), since blob URLs don't persist
  // across unmount/remount cycles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, getAuthHeader, mountCount.current])

  return blobUrl
}
