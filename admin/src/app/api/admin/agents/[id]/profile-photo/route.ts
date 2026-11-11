import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, unauthorized } from '@/lib/api-helpers'

/**
 * Admin agent profile photo proxy.
 *
 * GET /api/admin/agents/[id]/profile-photo
 *
 * Streams an agent's profile photo for an admin viewer. The admin's bearer
 * token is forwarded to the backend's admin endpoint:
 *   GET /api/v1/agents/{agentId}/profile-photo
 *
 * An agent calling this route for another agent gets 403 from the backend.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  if (!id || id.trim() === '')
    return NextResponse.json(
      { success: false, message: 'Missing agent id' },
      { status: 400, headers }
    )

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/agents/${encodeURIComponent(id)}/profile-photo`,
      {
        headers: { Authorization: token, Accept: '*/*' },
        redirect: 'follow',
      }
    )

    if (!upstreamRes.ok) {
      // 404 = no photo; 403 = not authorised (non-admin)
      return NextResponse.json(
        { success: false, message: 'No profile photo found' },
        { status: upstreamRes.status, headers }
      )
    }

    const contentType =
      upstreamRes.headers.get('Content-Type') || 'application/octet-stream'
    const etag = upstreamRes.headers.get('ETag') || ''

    // Check If-None-Match for 304
    const ifNoneMatch = req.headers.get('If-None-Match')
    if (ifNoneMatch && etag && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag },
      })
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    }
    if (etag) responseHeaders['ETag'] = etag

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error(`[admin/agents/${id}/profile-photo] GET error:`, error)
    return NextResponse.json(
      { success: false, message: 'Failed to load photo' },
      { status: 500, headers }
    )
  }
}
