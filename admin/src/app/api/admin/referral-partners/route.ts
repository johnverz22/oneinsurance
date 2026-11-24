import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import {
  BASE_URL,
  buildApiHeaders,
  getAuthToken,
  handleAxiosError,
  unauthorized,
} from '@/lib/api-helpers'

/**
 * List referral partners. Pagination links are rewritten to relative BFF paths.
 */
export async function GET(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const response = await axios.get(
      `${BASE_URL}/admin/referral-partners${req.nextUrl.search}`,
      { headers: { Authorization: token, Accept: 'application/json' } }
    )

    const payload = response.data
    const rewrite = (u: unknown) =>
      typeof u === 'string'
        ? u.replace(`${BASE_URL}/admin/referral-partners`, '/api/admin/referral-partners')
        : u

    if (payload?.data && typeof payload.data === 'object') {
      const d = payload.data
      for (const key of ['first_page_url', 'last_page_url', 'next_page_url', 'prev_page_url', 'path']) {
        if (key in d) d[key] = rewrite(d[key])
      }
      if (Array.isArray(d.links)) {
        d.links = d.links.map((l: { url?: unknown }) => ({ ...l, url: rewrite(l?.url) }))
      }
    }

    return NextResponse.json(payload, {
      status: response.status,
      headers: buildApiHeaders(req),
    })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referral partners' },
      { status: 500, headers: buildApiHeaders(req) }
    )
  }
}
