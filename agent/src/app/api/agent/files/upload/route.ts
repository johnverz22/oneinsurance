import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

// Reserved tags the backend rejects for agent uploads
const RESERVED_TAGS = new Set(['profile_photo', 'front_id', 'back_id'])

/**
 * POST /api/agent/files/upload
 *
 * Upload a document for a specific tag. The backend stores the file on
 * Google Drive with the name {tag}.{ext} and keeps the user's original
 * filename in `original_name`.
 *
 * Body (multipart/form-data):
 *   file  File    — the binary payload (PDF, JPG, PNG, WebP; max 5 MB)
 *   tag   string  — document slot (e.g. "valid_id", "insurance_qual_1")
 *
 * The backend ignores `file_name` and `folder_id` for agents, so we don't
 * send them.
 *
 * Response (on success, 201):
 *   { success: true, data: AgentFile }
 */
export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || typeof file === 'string')
      return NextResponse.json(
        { success: false, message: 'No file provided', errors: { file: 'No file provided' } },
        { status: 422, headers }
      )

    // Validate MIME type — PDF, JPG, PNG, WebP only
    const fileType = file.type.toLowerCase()
    if (!ACCEPTED_MIME.has(fileType))
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type',
          errors: { file: 'The file must be a PDF, JPG, PNG or WebP.' },
        },
        { status: 422, headers }
      )

    // Validate size — 5 MB max
    if (file.size > MAX_BYTES)
      return NextResponse.json(
        {
          success: false,
          message: 'File too large',
          errors: { file: 'The file size must not exceed 5MB.' },
        },
        { status: 422, headers }
      )

    const tag = (formData.get('tag') as string | null) || ''

    if (!tag)
      return NextResponse.json(
        { success: false, message: 'Missing tag', errors: { tag: 'A tag is required.' } },
        { status: 422, headers }
      )

    if (RESERVED_TAGS.has(tag))
      return NextResponse.json(
        { success: false, message: 'Reserved tag', errors: { tag: `The tag "${tag}" is reserved and cannot be uploaded here.` } },
        { status: 422, headers }
      )

    // Forward to the backend — send only file and tag.
    // The backend ignores file_name and folder_id for agents.
    const outbound = new FormData()
    outbound.append('file', file)
    outbound.append('tag', tag)

    const upstreamRes = await fetch(`${BASE_URL}/agents/files/upload`, {
      method: 'POST',
      headers: { Authorization: token, Accept: 'application/json' },
      body: outbound,
    })

    const data = await upstreamRes.json().catch(() => null)

    if (!upstreamRes.ok)
      return NextResponse.json(
        data || { success: false, message: 'Upload failed' },
        { status: upstreamRes.status, headers }
      )

    const raw = data?.data ?? data

    // Normalise into AgentFile shape
    const agentFile = raw
      ? {
          id: raw.id,
          file_name: raw.file_name || '',
          original_name: raw.original_name || '',
          tag: raw.tag || tag,
          mime_type: raw.mime_type || file.type,
          size: raw.size,
          status: raw.status || 'pending',
          file_id: raw.file_id,
          web_view_link: raw.web_view_link || raw.web_content_link || '',
          is_public: raw.is_public,
          created_at: raw.created_at || new Date().toISOString(),
          updated_at: raw.updated_at,
        }
      : null

    return NextResponse.json(
      { success: true, message: 'File uploaded successfully', data: agentFile },
      { status: upstreamRes.status, headers }
    )
  } catch (error: any) {
    console.error('[files/upload] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Could not save the document, please try again.' },
      { status: 500, headers }
    )
  }
}
