import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { AccountsResponse } from '@/types/account'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  if (!token || !token.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  const url = `${process.env.BASE_URL}/agents/accounts`
  try {
    const response = await axios.get<AccountsResponse>(url, {
      headers: {
        Authorization: token,
      },
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
