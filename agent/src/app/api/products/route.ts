import { AgentProductPaginatedResponse } from '@/types/products'
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
  const lobId = searchParams.get('lob_id')

  if (!token || !token.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  const url = `${process.env.BASE_URL}/admin/agent-products`
  try {
    const response = await axios.get<AgentProductPaginatedResponse>(url, {
      headers: {
        Authorization: token,
      },
      params: lobId ? { lob_id: lobId } : undefined,
    })
    return NextResponse.json(response.data, { headers })
  } catch (error: any) {
    console.error('Error fetching agent products:', error)
    return NextResponse.json(
      error.response?.data || { message: 'Internal Server Error' },
      { status: error.response?.status || 500, headers }
    )
  }
}
