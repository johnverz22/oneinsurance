import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const Schema = z.object({
  email: z.string().email(),
  redirectUrl: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ message: 'Invalid email' }, { status: 422, headers })

  const origin = req.nextUrl.origin || process.env.APP_URL || 'http://localhost:4000'
  const redirectUrl = parsed.data.redirectUrl || `${origin}/reset-password`

  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: parsed.data.email,
      redirectUrl,
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
