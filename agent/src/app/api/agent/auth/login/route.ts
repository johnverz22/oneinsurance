import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * Rewrite a backend profile_photo.url to the local Next.js proxy path so the
 * front end can always fetch it with the Authorization header via /api/agent/…
 *
 * The backend may return:
 *   "https://stage-api.oneinsurance.shop/api/v1/agents/profile-photo?v=42"
 *   "/api/v1/agents/profile-photo?v=42"
 */
function rewriteProfilePhotoUrl(url: string | undefined | null): string | null {
  if (!url) return null
  if (url.startsWith('/api/agent/')) return url   // already rewritten
  if (url.includes('/agents/profile-photo')) {
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
    return `/api/agent/profile/photo${qs}`
  }
  return url
}

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  if (!body)
    return NextResponse.json({ message: 'No data provided' }, { status: 400, headers })

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Invalid data', errors: parsed.error.flatten() },
      { status: 422, headers }
    )

  try {
    const response = await axios.post(`${BASE_URL}/agents/login`, parsed.data)
    const data = response.data

    // Rewrite profile_photo.url so the client can fetch it via our proxy
    const user = data?.data?.user
    if (user?.profile_photo?.url) {
      user.profile_photo.url = rewriteProfilePhotoUrl(user.profile_photo.url)
    }

    return NextResponse.json(data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
