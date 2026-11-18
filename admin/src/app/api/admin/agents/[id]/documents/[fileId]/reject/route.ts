import { NextRequest, NextResponse } from 'next/server'
import { proxyApiRequest, buildApiHeaders } from '@/lib/api-helpers'

/**
 * POST /api/admin/agents/[id]/documents/[fileId]/reject
 *
 * Proxies POST /admin/files/{fileId}/reject upstream. The body must include
 * `note` (required, max 500). Rejects an agent's verification document.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { fileId } = await params
  return proxyApiRequest(
    req,
    `/admin/files/${encodeURIComponent(fileId)}/reject`,
    { method: 'POST' }
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: buildApiHeaders({} as NextRequest) })
}
