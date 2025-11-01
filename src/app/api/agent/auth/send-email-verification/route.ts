import { SendEmailVerificationRequest } from '@/types/agent/auth'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

const headers = {
  'Content-Type': 'application/json',
  'Allow-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const token = req.headers.get('Authorization')

  if (!token || token.length === 0) {
    return NextResponse.json(
      { message: 'Authorization header is required' },
      { status: 400, headers }
    )
  }

  if (!body) {
    return NextResponse.json(
      { message: 'No data provided' },
      { status: 400, headers }
    )
  }

  if (!(body satisfies SendEmailVerificationRequest)) {
    return NextResponse.json(
      { message: 'Invalid data format' },
      { status: 400, headers }
    )
  }

  try {
    const result = await axios.post(
      `${process.env.BASE_URL}/auth/send-email-verification`,
      body,
      {
        headers: {
          Authorization: token,
        },
      }
    )
    return NextResponse.json(result.data, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error sending email verification:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ message: error }, { status: 500, headers })
  }
}
