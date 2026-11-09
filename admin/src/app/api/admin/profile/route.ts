import { NextRequest, NextResponse } from 'next/server'
import {
  buildApiHeaders,
  getAuthToken,
  proxyApiRequest,
  unauthorized,
} from '@/lib/api-helpers'

/**
 * Update the authenticated admin user's profile.
 * The upstream endpoint is keyed by user ID, supplied in the request body.
 */
export async function PUT(req: NextRequest) {
  if (!getAuthToken(req)) return unauthorized(req)

  const body = await req.json().catch(() => null)
  const userId = body?.id
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'User ID is required' },
      { status: 400, headers: buildApiHeaders(req) }
    )
  }

  return proxyApiRequest(req, `/admin/users/${userId}`, {
    search: false,
    data: body,
  })
}
