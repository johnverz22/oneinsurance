import { NextRequest } from 'next/server'
import { proxyApiRequest, buildApiHeaders } from '@/lib/api-helpers'

/**
 * GET /api/admin/files/[id]
 *
 * Proxies GET /admin/files/{id} upstream to fetch details of a specific file
 * (including a superseded / previous file).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyApiRequest(req, `/admin/files/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: buildApiHeaders({} as NextRequest) })
}
