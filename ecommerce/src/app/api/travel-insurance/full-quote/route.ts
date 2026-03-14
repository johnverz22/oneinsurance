import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.BASE_URL) {
      console.error('BASE_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error: BASE_URL is not set' },
        { status: 500 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/travel/full-quote`

    // Get the raw request body as a buffer and forward it with the original Content-Type
    // This avoids any server-side FormData serialization issues with axios
    const contentType = req.headers.get('content-type') || ''
    const bodyBuffer = await req.arrayBuffer()

    console.log('=== FULL QUOTE REQUEST ===')
    console.log('URL:', url)
    console.log('Content-Type:', contentType)
    console.log('Body size:', bodyBuffer.byteLength, 'bytes')

    const response = await axios.post(url, Buffer.from(bodyBuffer), {
      headers: {
        'Content-Type': contentType,
      },
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching travel insurance full quote:', error)

    if (axios.isAxiosError(error)) {
      console.error('Backend Error Response:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
