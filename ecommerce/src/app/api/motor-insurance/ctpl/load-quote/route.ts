import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body) return NextResponse.json({ error: 'Request body is required' }, { status: 400 })

    // Postman: POST /quote/motor/ctpl/load-quote
    // Body: { Type: "proposal", ProposalNo } or { Type: "policy", PolicyNo }
    const url = `${process.env.BASE_URL}/quote/motor/ctpl/load-quote`
    console.log('CTPL Load Quote URL:', url)

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`,
      },
      timeout: 60000,
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error('Error loading CTPL quote:', error.response?.data || error.message)
    if (axios.isAxiosError(error)) return handleServerSideAxiosError(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
