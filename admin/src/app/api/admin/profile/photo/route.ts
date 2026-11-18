import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, unauthorized } from '@/lib/api-helpers'

/**
 * Admin user profile photo proxy.
 *
 * Forwards to the backend's admin-me photo endpoints:
 *   POST   /api/v1/admin/me/photo   — upload or replace
 *   GET    /api/v1/admin/me/photo   — the image binary
 *   DELETE /api/v1/admin/me/photo   — remove
 *
 * The front end never gets a Google Drive link; it always reads the image
 * through this proxy so the bearer token is sent server-side.
 */

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const UPSTREAM_PATH = '/admin/me/photo'

// ─── POST: upload / replace ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const formData = await req.formData()
    const photo = formData.get('photo') as File | null

    if (!photo || typeof photo === 'string')
      return NextResponse.json(
        { success: false, message: 'No photo provided', errors: { photo: 'Please choose a photo to upload.' } },
        { status: 422, headers }
      )

    // Validate MIME type — only JPG, PNG, WebP
    if (!ALLOWED_TYPES.includes(photo.type.toLowerCase()))
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type',
          errors: { photo: 'The photo must be a JPG, PNG or WebP file.' },
        },
        { status: 422, headers }
      )

    // Validate size — 2 MB max
    if (photo.size > MAX_BYTES)
      return NextResponse.json(
        {
          success: false,
          message: 'File too large',
          errors: { photo: 'The photo must not exceed 2MB.' },
        },
        { status: 422, headers }
      )

    // Forward to the backend's admin-me photo endpoint
    const outbound = new FormData()
    outbound.append('photo', photo)

    const upstreamRes = await fetch(`${BASE_URL}${UPSTREAM_PATH}`, {
      method: 'POST',
      headers: { Authorization: token, Accept: 'application/json' },
      body: outbound,
    })

    const data = await upstreamRes.json().catch(() => null)

    if (!upstreamRes.ok) {
      // Pass through 422 errors with errors.photo, 403, and 502 as-is
      return NextResponse.json(
        data || { success: false, message: 'Photo upload failed' },
        { status: upstreamRes.status, headers }
      )
    }

    // The backend returns { success, message, data: { id, mime_type, updated_at, url } }
    // Rewrite the url to point to our local proxy so the client can fetch it with auth.
    const photoData = data?.data
    if (photoData?.url) {
      const qs = photoData.url.includes('?')
        ? photoData.url.slice(photoData.url.indexOf('?'))
        : `?v=${photoData.id}`
      photoData.url = `/api/admin/profile/photo${qs}`
    }

    return NextResponse.json(
      { success: true, message: data?.message ?? 'Profile photo saved successfully', data: photoData },
      { status: 201, headers }
    )
  } catch (error: unknown) {
    console.error('[admin/profile/photo] POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Could not save your photo, please try again.' },
      { status: 502, headers }
    )
  }
}

// ─── GET: stream the image binary ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(`${BASE_URL}${UPSTREAM_PATH}`, {
      headers: { Authorization: token, Accept: '*/*' },
      redirect: 'follow',
    })

    if (!upstreamRes.ok) {
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
  } catch (error: unknown) {
    console.error('[admin/profile/photo] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load photo' },
      { status: 500, headers }
    )
  }
}

// ─── DELETE: remove the photo ──────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(`${BASE_URL}${UPSTREAM_PATH}`, {
      method: 'DELETE',
      headers: { Authorization: token, Accept: 'application/json' },
    })

    if (!upstreamRes.ok) {
      const data = await upstreamRes.json().catch(() => null)
      return NextResponse.json(
        data || { success: false, message: 'Failed to remove photo' },
        { status: upstreamRes.status, headers }
      )
    }

    const data = await upstreamRes.json().catch(() => null)
    return NextResponse.json(
      data || { success: true, message: 'Profile photo removed successfully' },
      { status: 200, headers }
    )
  } catch (error: unknown) {
    console.error('[admin/profile/photo] DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to remove photo' },
      { status: 500, headers }
    )
  }
}
