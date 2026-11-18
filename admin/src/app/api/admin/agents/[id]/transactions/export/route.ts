import { NextRequest } from 'next/server'
import { proxyFileDownload } from '@/lib/api-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return proxyFileDownload(
    req,
    `/transactions/completed/agent/${(await params).id}/export`
  )
}
