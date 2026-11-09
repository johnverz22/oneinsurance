import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const id = req.nextUrl.searchParams.get('id')
  const url = id ? `${BASE_URL}/agents/referral/${id}` : `${BASE_URL}/agents/referral`

  try {
    const response = await axios.get(url, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
