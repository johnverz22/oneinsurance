import { NextRequest, NextResponse } from 'next/server'
import { HEADERS } from '@/constants/api-header'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')
  const body = await request.json()
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401, headers: HEADERS }
    )
  }

  if (!body || !body.keyword) {
    return NextResponse.json(
      { success: false, message: 'Bad Request' },
      { status: 400, headers: HEADERS }
    )
  }

  try {
    const url = `${process.env.BASE_URL}/agents/transactions/search`
    const response = await axios.post(url, body, {
      headers: {
        Authorization: token,
      },
    })

    return NextResponse.json(response.data, {
      status: response.status,
      headers: HEADERS,
    })
  } catch (error: any) {
    console.error('Error searching transactions:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      error.response.data || {
        success: false,
        message: 'Internal Server Error',
      },
      {
        status: error.response?.status || 500,
        headers: HEADERS,
      }
    )
  }
}
