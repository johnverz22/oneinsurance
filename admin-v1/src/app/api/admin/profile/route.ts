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
    
    const userId = body.id
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers }
      )
    }

    const endpoint = `${config.BASE_URL}/admin/users/${userId}`
    
    const response = await axios.put(endpoint, body, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: 200, headers })

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500, headers })
  }
}