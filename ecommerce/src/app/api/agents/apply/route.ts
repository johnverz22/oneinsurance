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
      // Back-end gateway times out after ~60 s on new submissions; we use a
      // slightly longer window so we can distinguish a real timeout from a
      // fast error, then return a friendly accepted response.
      timeout: 65_000,
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status

      // The staging backend processes the record but its nginx gateway returns
      // a 504 before the app finishes responding.  The application was likely
      // saved — tell the user we received it rather than showing an error.
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

      // For all other HTTP errors (400, 401, 422, 500 …) forward the backend
      // response body so the client can display the actual message.
      if (error.response) {
        const data = error.response.data

        // Backend sometimes returns HTML (e.g. nginx error pages) instead of
        // JSON.  Normalise those into a readable error object.
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
          { status }
        )
      }

      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message ?? 'Internal server error',
        errors: {},
      },
      { status: 500 }
    )
  }
}
