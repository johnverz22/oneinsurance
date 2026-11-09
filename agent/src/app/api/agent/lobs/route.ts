import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

/** GET /api/agent/lobs — fetch agent assigned lines of business */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const searchParams = req.nextUrl.searchParams
  const params = new URLSearchParams()
  if (searchParams.get('status')) params.set('status', searchParams.get('status')!)
  params.set('per_page', searchParams.get('per_page') || '100')

  try {
    const response = await axios.get(`${BASE_URL}/agents/lobs?${params.toString()}`, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
