import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json(
      { message: 'Authorization header required' },
      { status: 401, headers }
    )
  }

  // Get query parameters
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dev-one-insurance.intel-soln.com.ph/api/v1'
  
  try {
    let url = `${baseUrl}/admin/agent-statistics`
    if (dateFrom && dateTo) {
      url += `?date_from=${dateFrom}&date_to=${dateTo}`
    }

    const response = await axios.get(
      url,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    )

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Admin statistics error:', error)
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500
        }, 
        { status: error.response?.status || 500, headers }
      )
    }
    return NextResponse.json({ message: 'Statistics fetch failed' }, { status: 500, headers })
  }
}