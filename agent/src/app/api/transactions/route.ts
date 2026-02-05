import { NextRequest, NextResponse } from 'next/server'
import { HEADERS } from '@/constants/api-header'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')
  if (!token) {
    return new Response('Unauthorized', { status: 401, headers: HEADERS })
  }

  try {
    // Preserve any query string (e.g. ?page=2) when proxying to backend
    const incomingUrl = new URL(request.url)
    const query = incomingUrl.search
    const url = `${process.env.BASE_URL}/agents/transactions${query}`
    
    console.log('Agent: Fetching transactions from:', url)
    
    const response = await axios.get(url, {
      headers: {
        Authorization: token,
      },
    })

    // Log transaction data for debugging referral link issues
    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      console.log('Agent API: Transaction count:', response.data.data.data.length)
      console.log('Agent API: Sample transaction agent_code_used values:', 
        response.data.data.data.slice(0, 3).map((t: any) => ({
          id: t.id,
          agent_code_used: t.agent_code_used,
          agent_id: t.agent_id,
          status: t.status
        }))
      )
    }

    // Return the raw backend response without any enhancement or sample data
    console.log('Agent: Returning raw backend transaction data only - no sample data')
    return NextResponse.json(response.data, { status: 200, headers: HEADERS })
  } catch (error) {
    console.error('Agent: Error fetching transactions:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: error }, { status: 500, headers: HEADERS })
  }
}