import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildApiHeaders,
  getAuthToken,
  proxyApiRequest,
  unauthorized,
} from '@/lib/api-helpers'

const Schema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    password_confirmation: z.string().min(12),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'The password field confirmation does not match.',
    path: ['password_confirmation'],
  })

/** POST /api/admin/auth/change-password — change the authenticated admin's password */
export async function POST(req: NextRequest) {
  if (!getAuthToken(req)) return unauthorized(req)

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
      { status: 422, headers: buildApiHeaders(req) }
    )
  }

  return proxyApiRequest(req, '/auth/change-password', {
    search: false,
    data: parsed.data,
  })
}
