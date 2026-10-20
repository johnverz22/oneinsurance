import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json(
        { success: false, message: 'Request body is required', errors: {} },
        { status: 400 }
      )
    }

    const url = `${process.env.BASE_URL}/agents/apply`

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_ACCESS_TOKEN}`,
      },
      // Backend gateway times out after ~60s on new submissions; we use a slightly longer window
      timeout: 65_000,
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status

      // If backend processes record but gateway returns 504 or aborted
      if (status === 504 || error.code === 'ECONNABORTED') {
        return NextResponse.json(
          {
            success: true,
            message:
              "Your application has been received. We'll be in touch soon.",
          },
          { status: 200 }
        )
      }

      if (error.response) {
        const data = error.response.data
        const isJson =
          typeof data === 'object' && data !== null && !Buffer.isBuffer(data)

        return NextResponse.json(
          isJson
            ? data
            : {
                success: false,
                message: `Server error (${status}). Please try again.`,
                errors: {},
              },
          { status: status || 500 }
        )
      }

      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Internal server error',
        errors: {},
      },
      { status: 500 }
    )
  }
}
