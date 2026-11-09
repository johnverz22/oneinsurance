import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const Schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ message: 'Invalid OTP data' }, { status: 422, headers })

  try {
    const response = await axios.post(`${BASE_URL}/auth/login/otp/verify`, parsed.data)
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
