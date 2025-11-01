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

  if (!body.email || !body.redirectUrl) {
    return new Response(
      JSON.stringify({ message: 'Email and redirectUrl are required.' }),
      { status: 400, headers }
    )
  }

  try {
    const url = `${process.env.BASE_URL}/auth/forgot-password`
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { message: error },
      { status: error.response?.status, headers }
    )
  }
}
