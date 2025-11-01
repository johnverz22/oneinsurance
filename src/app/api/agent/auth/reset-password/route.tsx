import { ResetPasswordResponse, ResetPasswordSchema } from '@/types/agent/auth'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsedBody = ResetPasswordSchema.safeParse(body)

  if (!parsedBody.success) {
    return new Response(
      JSON.stringify({
        message: 'Invalid request data',
        errors: parsedBody.error.flatten().fieldErrors,
      }),
      { status: 400, headers }
    )
  }

  try {
    const url = `${process.env.BASE_URL}/auth/change-password`
    const response = await axios.post<ResetPasswordResponse>(
      url,
      {
        email: parsedBody.data.email,
        token: parsedBody.data.token,
        password: parsedBody.data.password,
        password_confirmation: parsedBody.data.confirmPassword,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    console.error('Reset password error:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return new Response(JSON.stringify({ message: error.message }), {
      status: error.response?.status,
      headers,
    })
  }
}
