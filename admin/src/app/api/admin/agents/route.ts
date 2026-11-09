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
 * List agents. Pagination links returned by the backend are rewritten to
 * relative BFF paths so the upstream origin is never exposed to the client.
 */
export async function GET(req: NextRequest) {
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const response = await axios.get(
      `${BASE_URL}/admin/agents${req.nextUrl.search}`,
      { headers: { Authorization: token, Accept: 'application/json' } }
    )

    const payload = response.data
    const rewrite = (u: unknown) =>
      typeof u === 'string' ? u.replace(`${BASE_URL}/admin/agents`, '/api/admin/agents') : u

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
      { success: false, message: 'Failed to fetch agents' },
      { status: 500, headers: buildApiHeaders(req) }
    )
  }
}
