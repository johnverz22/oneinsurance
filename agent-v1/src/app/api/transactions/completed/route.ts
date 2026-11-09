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
    const url = `${process.env.BASE_URL}/agents/transactions/completed${query}`
    
    console.log('Agent: Fetching completed transactions from:', url)
    
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
      },
    })

    console.log('Agent: Returning completed transactions data')
    return NextResponse.json(response.data, { status: 200, headers: HEADERS })
  } catch (error) {
    console.error('Agent: Error fetching completed transactions:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers: HEADERS })
  }
}
