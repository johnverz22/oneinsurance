import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, unauthorized } from '@/lib/api-helpers'

/**
 * Another administrator's profile photo proxy.
 *
 * GET  /api/admin/users/[id]/photo  — streams the photo binary
 *   → GET /api/v1/admin/users/{id}/photo  (any administrator token)
 *
 * POST /api/admin/users/[id]/photo  — upload / replace a user's photo
 *   → POST /api/v1/admin/users/{id}/photo
 *   Field name must be `photo` (not `profile_photo`).
 *
 * DELETE /api/admin/users/[id]/photo  — remove the photo
 *   → DELETE /api/v1/admin/users/{id}/photo
 */

type Ctx = { params: Promise<{ id: string }> }

// ─── GET: stream the image binary ──────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/users/${encodeURIComponent(id)}/photo`,
      {
        headers: { Authorization: token, Accept: '*/*' },
        redirect: 'follow',
      }
    )

    if (!upstreamRes.ok) {
      // 404 = no photo; 403 = not an administrator; pass through status.
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
      return new NextResponse(null, { status: 304, headers: { ETag: etag } })
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    }
    if (etag) responseHeaders['ETag'] = etag

    return new NextResponse(upstreamRes.body, { status: 200, headers: responseHeaders })
  } catch (error: unknown) {
    console.error(`[admin/users/${id}/photo] GET error:`, error)
    return NextResponse.json(
      { success: false, message: 'Failed to load photo' },
      { status: 500, headers }
    )
  }
}

// ─── POST: upload / replace another admin's photo ─────────────────────────

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  const formData = await req.formData()
  // Field name the backend expects is `photo`, not `profile_photo`.
  const file = formData.get('photo')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: 'No file provided', errors: { photo: 'Please choose a photo to upload.' } },
      { status: 400, headers }
    )
  }

  const upstream = new FormData()
  upstream.append('photo', file)

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/users/${encodeURIComponent(id)}/photo`,
      {
        method: 'POST',
        headers: { Authorization: token, Accept: 'application/json' },
        body: upstream,
      }
    )

    const data = await upstreamRes.json().catch(() => null)
    return NextResponse.json(
      data ?? { success: false, message: 'Photo upload failed' },
      { status: upstreamRes.status, headers }
    )
  } catch (error: unknown) {
    console.error(`[admin/users/${id}/photo] POST error:`, error)
    return NextResponse.json(
      { success: false, message: 'Photo upload failed' },
      { status: 500, headers }
    )
  }
}

// ─── DELETE: remove the photo ──────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/users/${encodeURIComponent(id)}/photo`,
      {
        method: 'DELETE',
        headers: { Authorization: token, Accept: 'application/json' },
      }
    )

    const data = await upstreamRes.json().catch(() => null)
    return NextResponse.json(
      data ?? { success: false, message: 'Failed to remove photo' },
      { status: upstreamRes.status, headers }
    )
  } catch (error: unknown) {
    console.error(`[admin/users/${id}/photo] DELETE error:`, error)
    return NextResponse.json(
      { success: false, message: 'Failed to remove photo' },
      { status: 500, headers }
    )
  }
}
