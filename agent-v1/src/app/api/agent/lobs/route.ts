import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  const perPage = searchParams.get('per_page') || '15'

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/agents/lobs`,
      {
        params: {
          status,
          sort_by: sortBy,
          sort_order: sortOrder,
          per_page: perPage,
        },
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      }
    )

    if (response.status !== 200) {
      return NextResponse.json(response.data, {
        status: response.status,
        headers,
      })
    }

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching agent LOBs:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}
