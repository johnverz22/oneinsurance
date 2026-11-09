import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  const searchParams = req.nextUrl.searchParams
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    // Agents can only view commission configurations, not modify them
    // Filter to only show active configurations by default
    const params = new URLSearchParams(searchParams.toString())
    if (!params.has('status')) {
      params.set('status', 'active')
    }
    
    const url = `${process.env.BASE_URL}/admin/commission-configurations?${params.toString()}`

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching commission configurations:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to fetch commission configurations' }, { status: 500, headers })
  }
}