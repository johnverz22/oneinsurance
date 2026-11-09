import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return proxyApiRequest(
    req,
    `/transactions/completed/agent/${(await params).id}`
  )
}
