import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  // date_from / date_to are optional. Send both or neither — without them the
  // backend returns all-time figures. Never inject a default range.
  const { searchParams } = req.nextUrl
  const params = new URLSearchParams()
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  const query = params.toString()

  try {
    const url = query
      ? `${BASE_URL}/agents/statistics?${query}`
      : `${BASE_URL}/agents/statistics`
    const response = await axios.get(url, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
