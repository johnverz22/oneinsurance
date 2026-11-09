import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/admin/agents/[id]/documents
 *
 * Lists the files an agent uploaded to Google Drive (verification documents,
 * profile photo). Proxies GET /admin/files/user/{id} upstream and normalises
 * each record into the AgentDocument shape used by the portal.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/files/user/${encodeURIComponent(id)}?limit=50&page=1`,
      { headers: { Authorization: token, Accept: 'application/json' } }
    )

    // No files on record is not an error for the profile page
    if (upstreamRes.status === 404 || upstreamRes.status === 422) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200, headers }
      )
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch documents', data: [] },
        { status: upstreamRes.status, headers }
      )
    }

    const json = await upstreamRes.json().catch(() => ({}))

    // Support the response shapes the backend might return:
    //   { data: [...] }  { data: { files: [...] } }  { data: { data: [...] } }  { files: [...] }  [...]
    let raw: Record<string, unknown>[] = []
    if (Array.isArray(json?.data)) raw = json.data
    else if (Array.isArray(json?.data?.files)) raw = json.data.files
    else if (Array.isArray(json?.data?.data)) raw = json.data.data
    else if (Array.isArray(json?.files)) raw = json.files
    else if (Array.isArray(json)) raw = json

    return NextResponse.json(
      { success: true, data: raw.map(normaliseFile) },
      { status: 200, headers }
    )
  } catch (error) {
    console.error(`[admin/agents/${id}/documents] Error:`, error)
    return NextResponse.json(
      { success: false, message: 'Server error', data: [] },
      { status: 500, headers }
    )
  }
}

/**
 * Map a raw backend file record to the portal's document shape.
 *
 * The backend ignores `tag` on upload (list always returns "document"), so the
 * agent portal encodes the real tag into the filename as
 * "<tag>__<random_hex>.<ext>" (see agent/docs/skills/google-drive-file-upload-flow.md).
 * Parse the prefix back out here so the UI can label each document.
 */
function normaliseFile(f: Record<string, unknown>) {
  const rawName = String(f.file_name ?? f.original_name ?? '')

  let tag = String(f.tag ?? 'document')
  const sepIdx = rawName.indexOf('__')
  if (sepIdx > 0) {
    const prefix = rawName.slice(0, sepIdx)
    // Only treat it as a tag prefix if it looks like a known slug (no spaces/dots)
    if (/^[a-z0-9_]+$/.test(prefix)) tag = prefix
  }

  return {
    id: f.id,
    tag,
    mime_type: f.mime_type ?? '',
    status: f.status ?? 'pending',
    created_at: f.created_at ?? null,
  }
}
