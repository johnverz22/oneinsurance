import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, unauthorized } from '@/lib/api-helpers'

/** GET /api/agent/documents — fetch agent uploaded verification documents */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/agents/files/list?folder_id=&limit=50&page=1`,
      { headers: { Authorization: token, Accept: 'application/json' } }
    )

    if (!upstreamRes.ok)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch documents', data: [] },
        { status: upstreamRes.status, headers }
      )

    const json = await upstreamRes.json().catch(() => ({}))
    const rawFiles = json?.data?.files ?? json?.data ?? []

    const mapped = Array.isArray(rawFiles)
      ? rawFiles.map((f: any) => ({
          id: f.id,
          name: f.file_name || f.original_name || 'Document',
          tag: f.tag || (f.mime_type?.includes('pdf') ? 'PDF' : 'Document'),
          status: f.status || 'pending',
          file_url: f.web_view_link || f.web_content_link || '',
          created_at: f.created_at || new Date().toISOString(),
        }))
      : []

    return NextResponse.json({ success: true, data: mapped }, { status: 200, headers })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error', data: [] },
      { status: 500, headers }
    )
  }
}

/** POST /api/agent/documents — upload a verification document */
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

    const fileName = (formData.get('file_name') as string) || file.name || 'document'
    const tag = (formData.get('tag') as string) || file.name.replace(/\.[^.]+$/, '') || 'document'

    const outbound = new FormData()
    outbound.append('file', file)
    outbound.append('file_name', fileName)
    outbound.append('tag', tag)

    const upstreamRes = await fetch(`${BASE_URL}/agents/files/upload`, {
      method: 'POST',
      headers: { Authorization: token, Accept: 'application/json' },
      body: outbound,
    })

    const data = await upstreamRes.json().catch(() => null)
    if (!upstreamRes.ok)
      return NextResponse.json(
        data || { success: false, message: 'Upload failed upstream' },
        { status: upstreamRes.status, headers }
      )

    return NextResponse.json(
      { success: true, message: 'Document uploaded successfully', data: data?.data ?? data },
      { status: 200, headers }
    )
  } catch (error: any) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500, headers }
    )
  }
}

/** DELETE /api/agent/documents — delete an uploaded document */
export async function DELETE(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const id = new URL(req.url).searchParams.get('id')
  if (!id)
    return NextResponse.json(
      { success: false, message: 'Missing document id' },
      { status: 400, headers }
    )

  try {
    const upstreamRes = await fetch(`${BASE_URL}/agents/files/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token, Accept: 'application/json' },
    })
    const data = await upstreamRes.json().catch(() => ({}))
    return NextResponse.json(
      data || { success: true, message: 'Document deleted' },
      { status: upstreamRes.status, headers }
    )
  } catch (error: any) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500, headers }
    )
  }
}
