import { NextRequest } from 'next/server'
import { proxyFileDownload } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  return proxyFileDownload(req, '/admin/agents/export')
}
