import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agent_id')
  const path = agentId
    ? `/transactions/completed/agent/${agentId}`
    : '/transactions'
  return proxyApiRequest(req, path)
}
