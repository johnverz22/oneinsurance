import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/**
 * GET /api/agent/files
 *
 * List the authenticated agent's files from Google Drive.
 *
 * Query params (all optional):
 *   tag       — filter by FileTag (e.g. "profile_photo", "valid_id")
 *   folder_id — filter by backend folder ID
 *   limit     — default 50
 *   page      — default 1
 *
 * Response:
 *   { success: true, data: AgentFile[] }
 *
 * When tag is supplied the request is routed to
 * GET /agents/files/tag/{tag} instead of /agents/files/list.
 */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const { searchParams } = new URL(req.url)
  const tag = searchParams.get('tag') ?? ''
  const folderId = searchParams.get('folder_id') ?? ''
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
      const params = new URLSearchParams({ folder_id: folderId, limit, page })
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

    // Log the raw shape in non-production to help diagnose response structure issues
    if (process.env.NODE_ENV !== 'production') {
      console.log('[files] GET upstream response shape:', JSON.stringify({
        keys: Object.keys(json),
        dataType: typeof json?.data,
        dataIsArray: Array.isArray(json?.data),
        dataKeys: json?.data && typeof json.data === 'object' ? Object.keys(json.data) : null,
        filesIsArray: Array.isArray(json?.data?.files),
        sampleLength: (json?.data?.files ?? json?.data ?? []).length,
      }))
    }

    // Support multiple response shapes the backend might return:
    //   { data: { files: [...] } }
    //   { data: [...] }
    //   { files: [...] }
    //   [...]
    let rawFiles: any[] = []
    if (Array.isArray(json?.data?.files)) {
      rawFiles = json.data.files
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

    return NextResponse.json({ success: true, data: files }, { status: 200, headers })
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
 * The backend ignores the `tag` field on upload and always stores "document".
 * To work around this, we generate an opaque filename at upload time:
 *   "<tag>__<random_hex>.<ext>"  e.g. "valid_id__a3f9c1e7.webp"
 *
 * This function extracts the tag from that prefix. The random suffix is not
 * surfaced — file_name is set to an empty string since the UI shows a static
 * "Uploaded" label instead of the filename.
 */
function normaliseFile(f: any) {
  const rawName: string = f.file_name || f.original_name || ''

  // Extract tag from "tag__randomhex.ext" prefix, fall back to whatever backend stored
  const SEPARATOR = '__'
  let tag: string = f.tag || 'document'

  const sepIdx = rawName.indexOf(SEPARATOR)
  if (sepIdx > 0) {
    const prefix = rawName.slice(0, sepIdx)
    // Only treat it as a tag prefix if it looks like a known slug (no spaces, no dots)
    if (/^[a-z0-9_]+$/.test(prefix)) {
      tag = prefix
      // Intentionally do not surface the random suffix — the UI shows "Uploaded" instead
    }
  }

  return {
    id: f.id,
    file_name: '',
    tag,
    mime_type: f.mime_type || '',
    status: f.status || 'pending',
    web_view_link: f.web_view_link || f.web_content_link || '',
    created_at: f.created_at || new Date().toISOString(),
  }
}
