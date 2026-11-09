import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { z } from 'zod'
import { BASE_URL, buildApiHeaders, handleAxiosError } from '@/lib/api-helpers'

const SignupSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
    token: z.string().min(10),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const body = await req.json().catch(() => null)
  if (!body)
    return NextResponse.json({ message: 'No data provided' }, { status: 400, headers })

  const parsed = SignupSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(
      { message: 'Invalid data', errors: parsed.error.flatten() },
      { status: 422, headers }
    )

  const { firstName, lastName, email, phone, password, confirmPassword, token } = parsed.data

  try {
    const response = await axios.post(`${BASE_URL}/agents/invitations/accept`, {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password,
      password_confirmation: confirmPassword,
      token,
    })
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json({ message: 'Server error' }, { status: 500, headers })
  }
}
