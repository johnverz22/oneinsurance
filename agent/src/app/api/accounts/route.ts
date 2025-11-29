import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { AccountsResponse } from '@/types/account'
import { HEADERS } from '@/constants/api-header'

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  if (!token || !token.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401, headers: HEADERS }
    )
  }

  const url = `${process.env.BASE_URL}/agents/accounts`
  try {
    const response = await axios.get<AccountsResponse>(url, {
      headers: {
        Authorization: token,
      },
    })
    return NextResponse.json(response.data, { headers: HEADERS })
  } catch (error: any) {
    console.error('Error fetching agent products:', error)
    return NextResponse.json(
      error.response?.data || { message: 'Internal Server Error' },
      { status: error.response?.status || 500, headers: HEADERS }
    )
  }
}
