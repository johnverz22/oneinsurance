import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  return proxyApiRequest(req, '/admin/agent-lobs')
}

export async function POST(req: NextRequest) {
  return proxyApiRequest(req, '/admin/agent-lobs')
}
