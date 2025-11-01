import { NextRequest, NextResponse } from 'next/server'
import { LoginAgentSchema } from '@/types/agent/auth'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body) {
    return NextResponse.json(
      { message: 'No data provided' },
      { status: 400, headers }
    )
  }
  const parseBody = LoginAgentSchema.safeParse(body)
  if (!parseBody.success) {
    return NextResponse.json(
      { message: 'Invalid data', errors: parseBody.error.flatten() },
      { status: 422, headers }
    )
  }

  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/agents/login`,
      parseBody.data
    )

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Login error:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    return NextResponse.json({ message: error }, { status: 500, headers })
  }
}
