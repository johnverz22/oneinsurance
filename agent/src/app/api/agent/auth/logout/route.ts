import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const response = await axios.post(
      `${BASE_URL}/agents/logout`,
      {},
      { headers: { Authorization: token } }
    )
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
