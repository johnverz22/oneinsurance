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
  { params }: { params: Promise<{ lobId: string }> }
) {
  const token = req.headers.get('Authorization')
  const { lobId } = await params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    // Use fallback URL if BASE_URL is not defined
    const baseUrl = process.env.BASE_URL || 'https://dev-one-insurance.intel-soln.com.ph/api/v1'
    const url = `${baseUrl}/admin/agent-lobs/lob/${lobId}/agents`

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching LOB agents:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}