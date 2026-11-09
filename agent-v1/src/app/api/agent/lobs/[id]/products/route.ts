import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('Authorization')
  const resolvedParams = await context.params
  const { id } = resolvedParams

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  const url = `${process.env.BASE_URL}/agents/lobs/${id}/products`

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    if (response.status !== 200) {
      return NextResponse.json(response.data, {
        status: response.status,
        headers,
      })
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }
    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}
