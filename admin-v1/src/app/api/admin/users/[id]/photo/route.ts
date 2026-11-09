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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('Authorization')
  const { id } = await params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('profile_photo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400, headers }
      )
    }

    // Create FormData for the backend API
    const backendFormData = new FormData()
    backendFormData.append('profile_photo', file)

    const response = await axios.post(
      `${config.BASE_URL}/admin/users/${id}/photo`,
      backendFormData,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error uploading admin profile photo:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get('Authorization')
  const { id } = await params

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const response = await axios.delete(
      `${config.BASE_URL}/admin/users/${id}/photo`,
      {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      }
    )

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error deleting admin profile photo:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers })
  }
}