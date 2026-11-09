import { NextRequest } from 'next/server'
import { proxyApiRequest } from '@/lib/api-helpers'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  return proxyApiRequest(req, `/admin/agent-lobs/${(await params).id}`)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return proxyApiRequest(req, `/admin/agent-lobs/${(await params).id}`)
}
