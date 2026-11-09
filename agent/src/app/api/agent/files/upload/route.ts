import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
])

/**
 * POST /api/agent/files/upload
 *
 * Unified file upload proxy for all agent file types (profile photo,
 * verification documents, etc.).  Accepts the same multipart fields as the
 * backend and forwards them directly — no local disk write.
 *
 * Body (multipart/form-data):
 *   file      File     — the binary payload
 *   file_name string   — desired filename (falls back to file.name)
 *   tag       string   — FileTag constant (e.g. "profile_photo", "valid_id")
 *   folder_id string?  — optional backend folder ID
 *
 * Response (on success):
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
        { success: false, message: 'No file provided' },
        { status: 400, headers }
      )

    if (file.size > MAX_BYTES)
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 10 MB.' },
        { status: 400, headers }
      )

    if (!ACCEPTED_MIME.has(file.type) && !isImageExtension(file.name))
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Accepted: JPG, PNG, WEBP, GIF, AVIF, PDF.' },
        { status: 400, headers }
      )

    const tag = (formData.get('tag') as string | null) || 'document'
    const folderId = (formData.get('folder_id') as string | null) || ''

    // Generate a fully opaque filename: "<tag>__<8-char random hex>.<ext>"
    // The original client filename is intentionally discarded — the tag prefix
    // is the only meaningful part and it is recovered by the list normaliser.
    const ext = extFromMime(file.type) || extFromName(file.name) || 'bin'
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const fileName = `${tag}__${randomHex}.${ext}`

    const outbound = new FormData()
    outbound.append('file', file)
    outbound.append('file_name', fileName)
    outbound.append('tag', tag)
    if (folderId) outbound.append('folder_id', folderId)

    const upstreamRes = await fetch(`${BASE_URL}/agents/files/upload`, {
      method: 'POST',
      headers: { Authorization: token, Accept: 'application/json' },
      body: outbound,
    })

    const data = await upstreamRes.json().catch(() => null)

    if (process.env.NODE_ENV !== 'production') {
      console.log('[files/upload] upstream response:', JSON.stringify({
        status: upstreamRes.status,
        tag,
        dataKeys: data ? Object.keys(data) : null,
        rawId: data?.data?.id ?? data?.id,
        rawTag: data?.data?.tag ?? data?.tag,
      }))
    }

    if (!upstreamRes.ok)
      return NextResponse.json(
        data || { success: false, message: 'Upload failed upstream' },
        { status: upstreamRes.status, headers }
      )

    const raw = data?.data ?? data

    // Normalise into AgentFile shape
    const agentFile = raw
      ? {
          id: raw.id,
          file_name: raw.file_name || raw.original_name || fileName,
          tag: raw.tag || tag,
          mime_type: raw.mime_type || file.type,
          status: raw.status || 'pending',
          web_view_link: raw.web_view_link || raw.web_content_link || '',
          created_at: raw.created_at || new Date().toISOString(),
        }
      : null

    return NextResponse.json(
      { success: true, message: 'File uploaded successfully', data: agentFile },
      { status: 200, headers }
    )
  } catch (error: any) {
    console.error('[files/upload] Error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500, headers }
    )
  }
}

function isImageExtension(name: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(name)
}

/** Derive a file extension from a MIME type */
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'application/pdf': 'pdf',
  }
  return map[mime] ?? ''
}

/** Derive a file extension from a filename */
function extFromName(name: string): string {
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
}
