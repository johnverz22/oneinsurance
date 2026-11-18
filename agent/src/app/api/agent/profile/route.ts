import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

/**
 * Rewrite the backend profile_photo.url to a local proxy path.
 *
 * The backend returns either:
 *   "/api/v1/agents/profile-photo?v=42"   (agent's own photo)
 *   "/api/v1/agents/{agentId}/profile-photo" (admin view)
 *
 * We strip the leading "/api/v1/agents" segment and prepend "/api/agent/profile/photo"
 * (for the agent's own route) or "/api/agent/{agentId}/profile-photo" (for admin routes).
 *
 * The query string (e.g. ?v=42) is preserved for cache-busting.
 */
function rewriteProfilePhotoUrl(
  url: string | undefined | null,
  agentId?: number | string
): string | null {
  if (!url) return null

  // Already a local proxy path
  if (url.startsWith('/api/agent/')) return url

  // Agent's own photo: /api/v1/agents/profile-photo?v=42 → /api/agent/profile/photo?v=42
  if (url.includes('/agents/profile-photo')) {
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    return `/api/agent/profile/photo${qs}`
  }

  // Admin route: /api/v1/agents/{agentId}/profile-photo → /api/agent/{agentId}/profile-photo
  const adminMatch = url.match(/\/api\/v1\/agents\/(\d+)\/profile-photo/)
  if (adminMatch) {
    const id = adminMatch[1]
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    return `/api/agent/${id}/profile-photo${qs}`
  }

  return url
}

/** GET /api/agent/profile — fetch current agent profile */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const response = await axios.get(`${BASE_URL}/agents/me`, {
      headers: { Authorization: token, Accept: 'application/json' },
    })

    // Rewrite profile_photo.url so the front end can use it directly
    const data = response.data?.data
    if (data?.profile_photo?.url) {
      data.profile_photo.url = rewriteProfilePhotoUrl(data.profile_photo.url, data.id)
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}

/** PATCH /api/agent/profile — update name and phone */
export async function PATCH(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const body = await req.json().catch(() => null)
  if (!body)
    return NextResponse.json({ message: 'No data provided' }, { status: 400, headers })

  // Send both `name` and split first_name/last_name — backend accepts either shape
  const { name, ...rest } = body
  const [first_name, ...lastParts] = typeof name === 'string' ? name.trim().split(/\s+/) : []
  const upstreamBody = {
    ...rest,
    name,
    first_name: first_name || body.first_name,
    last_name: lastParts.join(' ') || body.last_name || first_name || '',
  }

  try {
    const response = await axios.put(`${BASE_URL}/agents/profile`, upstreamBody, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
