import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/agent/files/[id]/serve
 *
 * Binary proxy for a single agent file stored on Google Drive.
 *
 * The backend's download endpoint returns the raw file bytes with the correct
 * Content-Type header.  This route streams those bytes back to the browser so
 * image files can be rendered directly as:
 *
 *   <img src="/api/agent/files/123/serve" />
 *
 * The route forwards the agent's bearer token so the backend can authorise the
 * download — Google Drive links are never exposed to the browser directly.
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
    const upstreamRes = await fetch(`${BASE_URL}/agents/files/${encodeURIComponent(id)}/download`, {
      headers: { Authorization: token, Accept: '*/*' },
      // Do not follow redirects blindly — Google Drive may 302 to a signed URL
      redirect: 'follow',
    })

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, message: 'File not found or access denied' },
        { status: upstreamRes.status, headers }
      )
    }

    // Determine content type — fall back to octet-stream if absent
    const contentType =
      upstreamRes.headers.get('Content-Type') || 'application/octet-stream'

    const contentDisposition = upstreamRes.headers.get('Content-Disposition') || ''

    // Stream the body back without buffering the whole file in memory
    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(contentDisposition ? { 'Content-Disposition': contentDisposition } : {}),
        // Cache for 1 hour (private — not shared across users)
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    console.error(`[files/${id}/serve] Error:`, error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500, headers }
    )
  }
}
