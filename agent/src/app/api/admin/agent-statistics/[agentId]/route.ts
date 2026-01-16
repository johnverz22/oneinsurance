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
  { params }: { params: { agentId: string } }
) {
  const token = req.headers.get('Authorization')
  const searchParams = req.nextUrl.searchParams
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const { agentId } = params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  if (!agentId) {
    return NextResponse.json(
      { error: 'Agent ID is required' },
      { status: 400, headers }
    )
  }

  try {
    const queryParams = new URLSearchParams()
    if (dateFrom) queryParams.append('date_from', dateFrom)
    if (dateTo) queryParams.append('date_to', dateTo)

    const url = `${process.env.BASE_URL}/admin/agent-statistics/${agentId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching specific agent statistics:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}
