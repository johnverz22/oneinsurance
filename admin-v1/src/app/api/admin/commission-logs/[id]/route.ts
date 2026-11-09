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

export async function GET(
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
    // Try to get the specific commission log by ID
    const url = `${config.BASE_URL}/admin/commission-logs/${id}`
    console.log('Fetching commission log by ID:', url)

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error: any) {
    console.error('Error fetching commission log by ID:', error)
    
    // If the specific endpoint doesn't exist, try to get all commission logs and find the one with matching ID
    try {
      console.log('Trying to fetch all commission logs and find by ID')
      const allLogsUrl = `${config.BASE_URL}/admin/commission-logs?per_page=100`
      
      const allLogsResponse = await axios.get(allLogsUrl, {
        headers: {
          Authorization: token,
          Accept: 'application/json',
        },
      })
      
      if (allLogsResponse.data?.data?.data && Array.isArray(allLogsResponse.data.data.data)) {
        const commission = allLogsResponse.data.data.data.find((c: any) => 
          c.id.toString() === id.toString()
        )
        
        if (commission) {
          return NextResponse.json({
            success: true,
            data: commission
          }, { status: 200, headers })
        }
      }
      
      return NextResponse.json(
        { success: false, message: 'Commission log not found' },
        { status: 404, headers }
      )
    } catch (fallbackError) {
      console.error('Fallback commission log fetch also failed:', fallbackError)
      if (axios.isAxiosError(fallbackError)) {
        return handleServerSideAxiosError(fallbackError)
      }
      return NextResponse.json({ error: 'Failed to fetch commission log' }, { status: 500, headers })
    }
  }
}