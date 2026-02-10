import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'date_from and date_to parameters are required' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dev-one-insurance.intel-soln.com.ph/api/v1'
    const backendUrl = `${baseUrl}/agents/commission-logs/summary?date_from=${dateFrom}&date_to=${dateTo}`

    console.log('Agent Commission Summary: Fetching from:', backendUrl)

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Agent Commission Summary: Backend error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Backend request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Agent Commission Summary: Success:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Agent Commission Summary: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}