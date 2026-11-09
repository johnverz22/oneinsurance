import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  return proxyApiRequest(req, '/admin/login', { auth: false, search: false })
}
