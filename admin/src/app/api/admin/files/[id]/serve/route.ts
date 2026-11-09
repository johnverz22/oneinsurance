import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/admin/files/[id]/serve
 *
 * Binary proxy for a single file stored on Google Drive.
 *
 * The backend's download endpoint returns the raw file bytes with the correct
 * Content-Type header. This route streams those bytes back to the browser so
 * files can be rendered via an authenticated fetch — the caller's Bearer token
 * is forwarded upstream, and Google Drive links are never exposed.
 *
 * Cache behaviour: files are immutable once uploaded, so a 1-hour private
 * cache is safe and avoids hammering the backend on re-renders.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  if (!id || id.trim() === '')
    return NextResponse.json(
      { success: false, message: 'Missing file id' },
      { status: 400, headers }
    )

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/files/${encodeURIComponent(id)}/download`,
      {
        headers: { Authorization: token, Accept: '*/*' },
        redirect: 'follow',
      }
    )

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, message: 'File not found or access denied' },
        { status: upstreamRes.status, headers }
      )
    }

    const contentType =
      upstreamRes.headers.get('Content-Type') || 'application/octet-stream'
    const contentDisposition =
      upstreamRes.headers.get('Content-Disposition') || ''

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(contentDisposition
          ? { 'Content-Disposition': contentDisposition }
          : {}),
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error(`[admin/files/${id}/serve] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500, headers }
    )
  }
}
