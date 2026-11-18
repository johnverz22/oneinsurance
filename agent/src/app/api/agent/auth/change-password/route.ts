import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError, unauthorized } from '@/lib/api-helpers'

const Schema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    password_confirmation: z.string().min(12).optional(),
    confirmPassword: z.string().min(12).optional(),
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

/** POST /api/agent/auth/change-password — change the authenticated agent's password */
export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = req.headers.get('Authorization')
  if (!token) return unauthorized(req)

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Invalid data', errors: parsed.error.flatten().fieldErrors },
      { status: 422, headers }
    )

  try {
    const response = await axios.post(
      `${BASE_URL}/agents/auth/change-password`,
      {
        current_password: parsed.data.current_password,
        password: parsed.data.password,
        password_confirmation:
          parsed.data.password_confirmation ?? parsed.data.confirmPassword,
      },
      { headers: { Authorization: token, 'Content-Type': 'application/json' } }
    )
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
