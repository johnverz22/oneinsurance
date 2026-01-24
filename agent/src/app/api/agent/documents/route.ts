import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Get all documents
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  if (!token) {
    return NextResponse.json(
      { 
        success: false,
        message: 'Unauthorized',
        data: null,
        errors: ['No authorization token']
      },
      { status: 401, headers }
    )
  }

  try {
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
    const url = new URL(req.url)
    const searchParams = url.searchParams
    
    // Default parameters for documents list
    const folder_id = searchParams.get('folder_id') || ''
    const limit = searchParams.get('limit') || '50'
    const page = searchParams.get('page') || '1'

    console.log('=== DOCUMENTS FETCH DEBUG ===')
    console.log('Token:', token ? 'Present' : 'Missing')
    console.log('Base URL:', baseUrl)
    console.log('Query params:', { folder_id, limit, page })

    const response = await axios.get(
      `${baseUrl}/agents/files/list?folder_id=${folder_id}&limit=${limit}&page=${page}`,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('Documents response status:', response.status)
    console.log('Documents response data:', response.data)

    return NextResponse.json(response.data, { status: 200, headers })

  } catch (error) {
    console.error('Error fetching documents:', error)
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      
      return NextResponse.json({
        success: false,
        message: error.response?.data?.message || 'Failed to fetch documents',
        data: null,
        errors: error.response?.data?.errors || ['Fetch failed']
      }, { 
        status: error.response?.status || 500, 
        headers 
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error',
      data: null,
      errors: ['Internal server error']
    }, { status: 500, headers })
  }
}