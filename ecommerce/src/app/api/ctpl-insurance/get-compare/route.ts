import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientRequestId = req.nextUrl.searchParams.get('ClientRequestId')
  const token = `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`

  if (!clientRequestId) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  const url = `${process.env.BASE_URL}/quote/compare?ClientRequestId=${clientRequestId}`

  try {
    const response = await pollForResult(url, token)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  } catch (error: any) {
    console.error('Error fetching comparison ctpl quote:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

const pollForResult = async (
  url: string,
  token: string,
  maxRetries: number = 60,
  pollInterval: number = 1000
): Promise<any> => {
  let retries = 0

  while (retries < maxRetries) {
    try {
      const result = await axios.get(url, {
        headers: { Authorization: token },
        timeout: 1000 * 60 * 5,
      })

      // If we get a successful response with data, return it
      if (result.status === 200 && result.data) {
        return result.data
      }

      // If status is 204, the resource is not ready yet
      if (result.status === 204) {
        console.log(`Polling attempt ${retries + 1}, resource not ready yet...`)
        retries++

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
        continue
      }

      // Handle other status codes
      throw new Error(`Unexpected status code: ${result.status}`)
    } catch (error) {
      // Handle timeout or network errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.log('Request timeout, retrying...', error)
      } else {
        console.error('Polling error:', error)
        throw error
      }

      retries++
      if (retries >= maxRetries) {
        throw new Error('Max polling attempts reached')
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }
  }

  throw new Error(
    'Polling timeout: Resource not available after maximum attempts'
  )
}
