import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const Schema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(8).optional(),
    confirmPassword: z.string().min(8).optional(),
  })
  .refine(
    (d) =>
      (d.password_confirmation && d.password === d.password_confirmation) ||
      (d.confirmPassword && d.password === d.confirmPassword),
    {
      message: 'The password field confirmation does not match.',
      path: ['password_confirmation'],
    }
  )

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
      { status: 422, headers }
    )

  try {
    const response = await axios.post(`${BASE_URL}/auth/change-password`, {
      email: parsed.data.email,
      token: parsed.data.token,
      password: parsed.data.password,
      password_confirmation: parsed.data.password_confirmation ?? parsed.data.confirmPassword,
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
