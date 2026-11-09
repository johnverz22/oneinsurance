import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return proxyApiRequest(req, `/admin/invitations/${(await params).id}/resend`, {
    data: {},
  })
}
