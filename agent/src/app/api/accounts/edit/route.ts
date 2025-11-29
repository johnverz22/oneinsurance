import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { HEADERS } from '@/constants/api-header'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')
  console.log('🚀 ~ POST ~ token:', token)
  const body = await request.json()
  console.log('🚀 ~ POST ~ body:', body)
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401, headers: HEADERS }
    )
  }

  if (!body) {
    return NextResponse.json(
      { success: false, message: 'Bad Request' },
      { status: 400, headers: HEADERS }
    )
  }

  const { id, ...values } = body

  try {
    const url = `${process.env.BASE_URL}/agents/accounts/${id}`
    const response = await axios.put(url, values, {
      headers: {
        Authorization: token,
      },
    })

    return NextResponse.json(response.data, {
      status: response.status,
      headers: HEADERS,
    })
  } catch (error: any) {
    console.error('Error :', error)
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
