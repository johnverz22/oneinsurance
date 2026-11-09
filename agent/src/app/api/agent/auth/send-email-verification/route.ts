import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ message: 'Invalid email' }, { status: 422, headers })

  try {
    const token = req.headers.get('Authorization')
    const response = await axios.post(
      token ? `${BASE_URL}/auth/send-email-verification` : `${BASE_URL}/auth/login/otp/resend`,
      parsed.data,
      token ? { headers: { Authorization: token } } : undefined
    )
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
