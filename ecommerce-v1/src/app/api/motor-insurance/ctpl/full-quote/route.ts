import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body) return NextResponse.json({ error: 'Request body is required' }, { status: 400 })

    const url = `${process.env.BASE_URL}/quote/motor/ctpl/full-quote`
    console.log('CTPL Full Quote URL:', url)
    console.log('Request body:', JSON.stringify(body, null, 2))

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_ACCESS_TOKEN}`,
      },
      timeout: 60000,
    })

    console.log('Full quote response:', JSON.stringify(response.data, null, 2))
    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching CTPL full quote:', error.response?.data || error.message)
    if (axios.isAxiosError(error)) return handleServerSideAxiosError(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
