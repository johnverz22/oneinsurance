import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    if (!formData) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/quote/travel/full-quote`

    if (!process.env.BASE_URL) {
      console.error('BASE_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error: BASE_URL is not set' },
        { status: 500 }
      )
    }

    console.log('=== FULL QUOTE REQUEST ===')
    console.log('URL:', url)
    console.log('FormData entries:')
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }

    // Forward the FormData directly to the backend
    // axios will set Content-Type with the correct multipart boundary automatically
    const response = await axios.post(url, formData)

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
