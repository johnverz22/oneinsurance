import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const { searchParams } = req.nextUrl
  const params = new URLSearchParams()

  const now = new Date()
  const defaultDateFrom = `${now.getFullYear() - 1}-01-01`
  const defaultDateTo = now.toISOString().split('T')[0]

  params.set('date_from', searchParams.get('date_from') || defaultDateFrom)
  params.set('date_to', searchParams.get('date_to') || defaultDateTo)

  try {
    const url = `${BASE_URL}/agents/statistics?${params.toString()}`
    const response = await axios.get(url, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
