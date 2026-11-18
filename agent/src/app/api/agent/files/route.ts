import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/agent/files
 *
 * List the authenticated agent's files from Google Drive.
 *
 * Query params (all optional):
 *   tag       — filter by tag (e.g. "valid_id")
 *   limit     — default 50
 *   page      — default 1
 *
 * Response:
 *   { success: true, data: AgentFile[], pagination: {...} }
 *
 * The backend now returns { data: { files: [...], pagination: {...} } }.
 * We normalise each file into the AgentFile shape and pass pagination through.
 */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag') ?? ''
  const limit = searchParams.get('limit') ?? '50'
  const page = searchParams.get('page') ?? '1'

  try {
    let upstreamUrl: string

    if (tag) {
      // Tag-scoped endpoint
      const params = new URLSearchParams({ limit, page })
      upstreamUrl = `${BASE_URL}/agents/files/tag/${encodeURIComponent(tag)}?${params}`
    } else {
      // Full list endpoint
      const params = new URLSearchParams({ limit, page })
      upstreamUrl = `${BASE_URL}/agents/files/list?${params}`
    }

    const upstreamRes = await fetch(upstreamUrl, {
      headers: { Authorization: token, Accept: 'application/json' },
    })

    if (!upstreamRes.ok)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch files', data: [] },
        { status: upstreamRes.status, headers }
      )

    const json = await upstreamRes.json().catch(() => ({}))

    // The backend now returns { data: { files: [...], pagination: {...} } }
    // Keep backward-compat fallbacks for older response shapes.
    let rawFiles: any[] = []
    let pagination: any = null

    if (Array.isArray(json?.data?.files)) {
      rawFiles = json.data.files
      pagination = json.data.pagination ?? null
    } else if (Array.isArray(json?.data?.data)) {
      rawFiles = json.data.data
      pagination = json.data.pagination ?? null
    } else if (Array.isArray(json?.data)) {
      rawFiles = json.data
    } else if (Array.isArray(json?.files)) {
      rawFiles = json.files
    } else if (Array.isArray(json)) {
      rawFiles = json
    }

    const files = Array.isArray(rawFiles)
      ? rawFiles.map(normaliseFile)
      : []

    const response: any = { success: true, data: files }
    if (pagination) response.pagination = pagination

    return NextResponse.json(response, { status: 200, headers })
  } catch (error: any) {
    console.error('[files] GET error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error', data: [] },
      { status: 500, headers }
    )
  }
}

/** Map a raw backend file record to the AgentFile shape.
 *
 * The backend now persists `tag` correctly. We use it directly when it is
 * a known tag. If the tag is missing or generic ("document"), fall back to
 * parsing the `tag__hex.ext` filename prefix — this handles legacy files
 * until the backfill is confirmed on all environments.
 *
 * `original_name` is kept for display. For legacy files it may contain a
 * `tag__hex` name; the UI checks for `__` and shows a static label instead.
 */
function normaliseFile(f: any) {
  const knownTags = [
    'valid_id',
    'insurance_qual_1',
    'insurance_qual_2',
    'insurance_qual_3',
    'agent_license',
    'profile_photo',
  ]

  let tag: string = f.tag || 'document'

  // Fallback: parse tag from legacy "tag__hex.ext" filename
  if (!knownTags.includes(tag)) {
    const rawName: string = f.file_name || f.original_name || ''
    const sepIdx = rawName.indexOf('__')
    if (sepIdx > 0) {
      const prefix = rawName.slice(0, sepIdx)
      if (/^[a-z0-9_]+$/.test(prefix)) tag = prefix
    }
  }

  return {
    id: f.id,
    file_name: f.file_name || '',
    original_name: f.original_name || '',
    tag,
    mime_type: f.mime_type || '',
    size: f.size,
    status: f.status || 'pending',
    review_status: f.review_status ?? f.status,
    review_note: f.review_note ?? null,
    reviewed_at: f.reviewed_at ?? null,
    file_id: f.file_id,
    web_view_link: f.web_view_link || f.web_content_link || '',
    is_public: f.is_public,
    created_at: f.created_at || new Date().toISOString(),
    updated_at: f.updated_at,
  }
}
