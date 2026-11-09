import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

/** GET /api/agent/accounts — fetch bank details and e-wallets */
export async function GET(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const response = await axios.get(`${BASE_URL}/agents/accounts`, {
      headers: { Authorization: token, Accept: 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}

/** POST /api/agent/accounts — add new bank account or e-wallet */
export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  try {
    const body = await req.json()
    const response = await axios.post(`${BASE_URL}/agents/accounts`, body, {
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
