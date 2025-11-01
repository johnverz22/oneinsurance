import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'No token provided' },
      { status: 401, headers }
    )
  }

  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/agents/logout`,
      {},
      {
        headers: {
          Authorization: token,
        },
      }
    )

    if (response.status !== 200) {
      return NextResponse.json(
        { success: false, message: response.data },
        { status: response.status, headers }
      )
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Logout error:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ message: error }, { status: 500, headers })
  }
}
