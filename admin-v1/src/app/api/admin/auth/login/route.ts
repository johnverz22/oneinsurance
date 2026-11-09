import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body) {
    return NextResponse.json(
      { message: 'No data provided' },
      { status: 400, headers }
    )
  }

  // Debug environment variables
  console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)
  console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('BASE')))

  // Use fallback if BASE_URL is undefined
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dev-one-insurance.intel-soln.com.ph/api/v1'
  
  try {
    console.log('Admin login URL:', `${baseUrl}/admin/login`)
    console.log('Admin login data:', body)
    
    const response = await axios.post(
      `${baseUrl}/admin/login`,
      body
    )

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Admin login error:', error)
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          message: error.response?.data?.message || error.message,
          status: error.response?.status || 500
        }, 
        { status: error.response?.status || 500, headers }
      )
    }
    return NextResponse.json({ message: 'Login failed' }, { status: 500, headers })
  }
}