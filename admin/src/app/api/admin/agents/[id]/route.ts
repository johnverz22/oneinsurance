import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, proxyApiRequest, unauthorized } from '@/lib/api-helpers'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Rewrite a backend profile photo URL to the admin proxy route.
 *
 * The dedicated endpoint is "/api/v1/agents/{agentId}/profile-photo" (with an
 * optional ?v= query); older records may still point at the agent app's file
 * proxy ("/api/agent/files/{id}/serve"). We swap both for their admin
 * equivalents so the admin token is sent.
 */
function rewriteProfilePhotoUrl(url: string | undefined | null, agentId?: number | string): string | null {
  if (!url) return null
  if (url.startsWith('/api/admin/')) return url

  if (url.includes('/profile-photo') && agentId) {
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    return `/api/admin/agents/${agentId}/profile-photo${qs}`
  }

  const fileServe = url.match(/\/api\/(?:agent\/|v1\/)?files\/([^/]+)\/serve/)
  if (fileServe) return `/api/admin/files/${fileServe[1]}/serve`

  return url
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(`${BASE_URL}/admin/agents/${encodeURIComponent(id)}${req.nextUrl.search}`, {
      headers: { Authorization: token, Accept: 'application/json' },
    })

    const json = await upstreamRes.json().catch(() => null)

    if (!upstreamRes.ok) {
      return NextResponse.json(
        json ?? { success: false, message: 'Failed to load agent' },
        { status: upstreamRes.status, headers }
      )
    }

    // Rewrite photo URLs to the admin proxy routes. The backend may return the
    // structured profile_photo object or the legacy flat profile_photo_url.
    const data = json?.data ?? json
    const photoAgentId = data?.id ?? id
    if (data?.profile_photo?.url) {
      data.profile_photo.url = rewriteProfilePhotoUrl(data.profile_photo.url, photoAgentId)
    }
    if (data?.profile_photo_url) {
      data.profile_photo_url = rewriteProfilePhotoUrl(data.profile_photo_url, photoAgentId)
    }

    return NextResponse.json(json, { status: 200, headers })
  } catch (error: any) {
    console.error(`[admin/agents/${id}] GET error:`, error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500, headers }
    )
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return proxyApiRequest(req, `/admin/agents/${(await params).id}`)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return proxyApiRequest(req, `/admin/agents/${(await params).id}`)
}
