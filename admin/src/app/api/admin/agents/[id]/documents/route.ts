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
 * The backend historically ignored `tag` on upload (list always returned
 * "document"), so the agent portal encodes the real tag into the filename as
 * "<tag>__<random_hex>.<ext>". Parse the prefix back out here so the UI can
 * label each document.
 *
 * If the backend now returns a specific tag (not "document"), use it directly.
 */
function normaliseFile(f: Record<string, unknown>) {
  const rawName = String(f.file_name ?? f.original_name ?? '')

  const knownTags = [
    'valid_id',
    'insurance_qual_1',
    'insurance_qual_2',
    'insurance_qual_3',
    'agent_license',
    'profile_photo',
  ]
  let tag = String(f.tag ?? 'document')

  if (!knownTags.includes(tag)) {
    const sepIdx = rawName.indexOf('__')
    if (sepIdx > 0) {
      const prefix = rawName.slice(0, sepIdx)
      // Only treat it as a tag prefix if it looks like a known slug (no spaces/dots)
      if (/^[a-z0-9_]+$/.test(prefix)) tag = prefix
    }
  }

  return {
    id: f.id,
    file_name: String(f.file_name ?? ''),
    original_name: String(f.original_name ?? ''),
    tag,
    mime_type: String(f.mime_type ?? ''),
    size: f.size as number | undefined,
    status: String(f.status ?? 'pending'),
    review_status: f.review_status as 'pending' | 'approved' | 'rejected' | undefined,
    review_note: f.review_note as string | null | undefined,
    reviewed_at: (f.reviewed_at as string | null | undefined) ?? null,
    reviewed_by: (f.reviewed_by as number | undefined) ?? undefined,
    previous_file_id: (f.previous_file_id as number | null) ?? null,
    previous_review_status: (f.previous_review_status as 'pending' | 'approved' | 'rejected' | null) ?? null,
    previous_review_note: (f.previous_review_note as string | null) ?? null,
    previous_reviewed_at: (f.previous_reviewed_at as string | null) ?? null,
    previous_web_view_link: (f.previous_web_view_link as string | null) ?? null,
    replaced_by_file_id: (f.replaced_by_file_id as number | null) ?? null,
    created_at: (f.created_at as string | null) ?? null,
    updated_at: (f.updated_at as string | undefined) ?? undefined,
  }
}
