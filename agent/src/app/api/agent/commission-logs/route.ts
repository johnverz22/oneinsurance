import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, getAuthToken, handleAxiosError, unauthorized } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  const searchParams = req.nextUrl.searchParams

  try {
    const url = `${BASE_URL}/agents/commission-logs?${searchParams.toString()}`
    const response = await axios.get(url, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500, headers }
    )
  }
}
