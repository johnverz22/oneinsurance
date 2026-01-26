import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/config/env'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('Authorization')

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const body = await req.json()
    
    console.log('Admin Profile API - Request body:', body)
    console.log('Admin Profile API - Token:', token ? 'present' : 'missing')

    // Extract user ID from the request body
    const userId = body.id || body.user_id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers }
      )
    }

    // Use the correct endpoint from the Postman collection: PUT /admin/users/{id}
    const endpoint = `${config.BASE_URL}/admin/users/${userId}`
    
    console.log('Admin Profile API - Using endpoint:', endpoint)
    console.log('Admin Profile API - Request data:', body)
    
    const response = await axios.put(endpoint, body, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('Admin Profile API - Success:', response.status)
    return NextResponse.json(response.data, { status: 200, headers })

  } catch (error: any) {
    console.error('Admin Profile API - Error:', error)
    if (axios.isAxiosError(error)) {
      console.error('Admin Profile API - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500, headers })
  }
}