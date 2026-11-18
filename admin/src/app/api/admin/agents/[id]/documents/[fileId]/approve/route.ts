import { NextRequest, NextResponse } from 'next/server'
import { proxyApiRequest, buildApiHeaders } from '@/lib/api-helpers'

/**
 * POST /api/admin/agents/[id]/documents/[fileId]/approve
 *
 * Proxies POST /admin/files/{fileId}/approve upstream. Approves an agent's
 * verification document (clears any prior rejection note).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { fileId } = await params
  return proxyApiRequest(
    req,
    `/admin/files/${encodeURIComponent(fileId)}/approve`,
    { method: 'POST' }
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: buildApiHeaders({} as NextRequest) })
}
