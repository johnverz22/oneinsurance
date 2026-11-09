import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  const token = body?.token

  if (!token || typeof token !== 'string' || token.length < 10)
    return NextResponse.json(
      { message: 'Invalid or missing token' },
      { status: 400, headers }
    )

  try {
    const response = await axios.post(`${BASE_URL}/invitations/applicant`, { token })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
