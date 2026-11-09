import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/agent/files/[id]
 *
 * Retrieve metadata for a single file owned by the authenticated agent.
 *
 * Response:
 *   { success: true, data: AgentFile }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(`${BASE_URL}/agents/files/${encodeURIComponent(id)}`, {
      headers: { Authorization: token, Accept: 'application/json' },
    })

    const data = await upstreamRes.json().catch(() => null)

    if (!upstreamRes.ok)
      return NextResponse.json(
        data || { success: false, message: 'File not found' },
        { status: upstreamRes.status, headers }
      )

    const raw = data?.data ?? data
    const agentFile = raw
      ? {
          id: raw.id,
          file_name: raw.file_name || raw.original_name || 'File',
          tag: raw.tag || 'document',
          mime_type: raw.mime_type || '',
          status: raw.status || 'pending',
          web_view_link: raw.web_view_link || raw.web_content_link || '',
          created_at: raw.created_at || new Date().toISOString(),
        }
      : null

    return NextResponse.json({ success: true, data: agentFile }, { status: 200, headers })
  } catch (error: any) {
    console.error(`[files/${id}] GET error:`, error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500, headers }
    )
  }
}

/**
 * DELETE /api/agent/files/[id]
 *
 * Delete a file owned by the authenticated agent.
 *
 * Response:
 *   { success: true, message: 'File deleted' }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(`${BASE_URL}/agents/files/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: token, Accept: 'application/json' },
    })

    const data = await upstreamRes.json().catch(() => ({}))

    return NextResponse.json(
      data || { success: true, message: 'File deleted' },
      { status: upstreamRes.status, headers }
    )
  } catch (error: any) {
    console.error(`[files/${id}] DELETE error:`, error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500, headers }
    )
  }
}
