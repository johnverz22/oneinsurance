import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, proxyApiRequest, unauthorized } from '@/lib/api-helpers'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Rewrite the backend profile_photo.url to the admin proxy route.
 *
 * The backend returns "/api/v1/agents/{agentId}/profile-photo" (with an
 * optional ?v= query). We swap it for "/api/admin/agents/{agentId}/profile-photo".
 */
function rewriteProfilePhotoUrl(url: string | undefined | null, agentId?: number | string): string | null {
  if (!url) return null
  if (url.startsWith('/api/admin/')) return url

  if (url.includes('/agents/') && url.includes('/profile-photo')) {
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    if (agentId) return `/api/admin/agents/${agentId}/profile-photo${qs}`
  }

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

    // Rewrite profile_photo.url to the admin proxy route
    const data = json?.data ?? json
    if (data?.profile_photo?.url) {
      data.profile_photo.url = rewriteProfilePhotoUrl(data.profile_photo.url, data?.id ?? id)
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
