import { NextRequest, NextResponse } from 'next/server'
import {
  BASE_URL,
  buildApiHeaders,
  getAuthToken,
  unauthorized,
} from '@/lib/api-helpers'

/**
 * Update the authenticated admin user's profile.
 *
 * The backend's PUT /admin/users/{id} is keyed by user ID.
 * We read the id from the request body, then forward ONLY the profile fields
 * (first_name, last_name, email, phone, designation) — never the id itself,
 * which would leak it to the upstream and cause unexpected behaviour.
 *
 * Returns 403 when the target is a superadmin account; that is passed
 * through to the client so the UI can show the read-only state.
 */

const PROFILE_FIELDS = ['first_name', 'last_name', 'email', 'phone', 'designation'] as const

export async function PUT(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  const body = await req.json().catch(() => null)
  const userId = body?.id
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'User ID is required' },
      { status: 400, headers }
    )
  }

  // Send only the profile fields — not id or any other field.
  const payload: Record<string, string> = {}
  for (const field of PROFILE_FIELDS) {
    if (body[field] !== undefined && body[field] !== null) {
      payload[field] = body[field]
    }
  }

  try {
    const upstreamRes = await fetch(
      `${BASE_URL}/admin/users/${encodeURIComponent(userId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await upstreamRes.json().catch(() => null)

    // 403 means the target is a superadmin — pass through so the UI can react.
    return NextResponse.json(
      data ?? { success: false, message: 'Failed to update profile' },
      { status: upstreamRes.status, headers }
    )
  } catch (error: unknown) {
    console.error('[admin/profile] PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error — please try again later.' },
      { status: 500, headers }
    )
  }
}
