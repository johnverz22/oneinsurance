import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

/** GET /api/agent/profile — fetch current agent profile */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const response = await axios.get(`${BASE_URL}/agents/profile`, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}

/** PATCH /api/agent/profile — update name and phone */
export async function PATCH(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const body = await req.json().catch(() => null)
  if (!body)
    return NextResponse.json({ message: 'No data provided' }, { status: 400, headers })

  try {
    const response = await axios.put(`${BASE_URL}/agents/profile`, body, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
