import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  // The upstream endpoint resolves transactions by ID.
  return proxyApiRequest(req, `/transactions/${(await params).policyId}`)
}
