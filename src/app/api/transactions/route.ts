import { NextRequest, NextResponse } from 'next/server'
import { HEADERS } from '@/constants/api-header'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: HEADERS })
  }

  try {
    // Preserve any query string (e.g. ?page=2) when proxying to backend
    const incomingUrl = new URL(request.url)
    const query = incomingUrl.search
    const url = `${process.env.BASE_URL}/agents/transactions${query}`
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
      },
    })

    return NextResponse.json(response.data, {
      status: response.status,
      headers: HEADERS,
    })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      error.response?.data || { message: 'Internal Server Error' },
      { status: 500, headers: HEADERS }
    )
  }
}
