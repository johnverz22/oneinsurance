import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, proxyApiRequest, unauthorized } from '@/lib/api-helpers'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Rewrite the backend profile_photo.url to our local proxy routes.
 *
 * The backend returns one of:
 *   /api/v1/admin/me/photo?v=42          — the signed-in admin's own photo
 *   /api/v1/admin/users/{id}/photo?v=42  — another admin's photo
 *
 * We swap each for the corresponding Next.js proxy route so the bearer token
 * is sent server-side and the client never gets a raw backend URL.
 */
function rewriteProfilePhotoUrl(url: string | undefined | null, userId: string): string | null {
  if (!url) return null
  // Already rewritten (idempotent)
  if (url.startsWith('/api/admin/profile/photo') || url.startsWith('/api/admin/users/')) return url

  const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''

  // Own photo: /api/v1/admin/me/photo?v=42
  if (url.includes('/admin/me/photo')) {
    return `/api/admin/profile/photo${qs}`
  }

  // Another admin's photo: /api/v1/admin/users/{id}/photo?v=42
  if (url.includes(`/admin/users/${userId}/photo`) || (url.includes('/admin/users/') && url.includes('/photo'))) {
    return `/api/admin/users/${encodeURIComponent(userId)}/photo${qs}`
  }

  // Legacy path pre-PR#55: /api/v1/admin/users/profile-photo
  if (url.includes('/admin/users/profile-photo')) {
    return `/api/admin/profile/photo${qs}`
  }

  return url
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/users/${encodeURIComponent(id)}${req.nextUrl.search}`,
      { headers: { Authorization: token, Accept: 'application/json' } }
    )

    const json = await upstreamRes.json().catch(() => null)

    if (!upstreamRes.ok) {
      return NextResponse.json(
        json ?? { success: false, message: 'Failed to load user' },
        { status: upstreamRes.status, headers }
      )
    }

    // Rewrite profile_photo.url to the admin proxy route
    const data = json?.data ?? json
    if (data?.profile_photo?.url) {
      data.profile_photo.url = rewriteProfilePhotoUrl(data.profile_photo.url, id)
    }

    return NextResponse.json(json, { status: 200, headers })
  } catch (error: any) {
    console.error(`[admin/users/${id}] GET error:`, error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500, headers }
    )
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return proxyApiRequest(req, `/admin/users/${(await params).id}`)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return proxyApiRequest(req, `/admin/users/${(await params).id}`)
}
