import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  if (!body)
    return NextResponse.json({ message: 'No data provided' }, { status: 400, headers })

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Invalid data', errors: parsed.error.flatten() },
      { status: 422, headers }
    )

  try {
    const response = await axios.post(`${BASE_URL}/agents/login`, parsed.data)
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
