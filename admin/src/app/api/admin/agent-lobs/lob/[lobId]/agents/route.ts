import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lobId: string }> }
) {
  return proxyApiRequest(
    req,
    `/admin/agent-lobs/lob/${(await params).lobId}/agents`
  )
}
