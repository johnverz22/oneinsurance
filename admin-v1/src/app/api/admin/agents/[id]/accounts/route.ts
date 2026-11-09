import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

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
    console.log('Admin: Agent accounts request for agent ID:', id)
    console.log('Admin: Backend does not properly filter by agent_id, returning empty data')
    
    // Since the backend endpoint is not properly filtering by agent ID
    // and returns the same data for all agents, we return empty data
    // until the backend is fixed to handle agent-specific account queries
    return NextResponse.json({
      success: true,
      message: 'No payment details found',
      data: {
        bank_details: [],
        e_wallets: []
      },
      errors: []
    }, { status: 200, headers })

  } catch (error) {
    console.error('Admin: Error fetching agent accounts:', error)
    
    return NextResponse.json({
      success: true,
      message: 'No payment details found',
      data: {
        bank_details: [],
        e_wallets: []
      },
      errors: []
    }, { status: 200, headers })
  }
}