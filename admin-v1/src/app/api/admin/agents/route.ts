import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import { config } from '@/config/env'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')
  const searchParams = req.nextUrl.searchParams

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers }
    )
  }

  try {
    const url = `${config.BASE_URL}/admin/agents?${searchParams.toString()}`

    const response = await axios.get(url, {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    })

    // Backend returns array format, need to transform to pagination format
    if (response.data.success && Array.isArray(response.data.data)) {
      const agents = response.data.data
      const page = parseInt(searchParams.get('page') || '1')
      const perPage = parseInt(searchParams.get('per_page') || '15')
      const total = agents.length
      const lastPage = Math.ceil(total / perPage)
      const from = total > 0 ? ((page - 1) * perPage) + 1 : null
      const to = Math.min(page * perPage, total)
      const paginatedAgents = agents.slice((page - 1) * perPage, page * perPage)

      const paginatedResponse = {
        success: response.data.success,
        message: response.data.message,
        data: {
          current_page: page,
          data: paginatedAgents,
          first_page_url: `${config.BASE_URL}/admin/agents?page=1&per_page=${perPage}`,
          from: paginatedAgents.length > 0 ? from : null,
          last_page: lastPage,
          last_page_url: `${config.BASE_URL}/admin/agents?page=${lastPage}&per_page=${perPage}`,
          links: [
            {
              url: page > 1 ? `${config.BASE_URL}/admin/agents?page=${page - 1}&per_page=${perPage}` : null,
              label: "&laquo; Previous",
              active: false
            },
            {
              url: `${config.BASE_URL}/admin/agents?page=${page}&per_page=${perPage}`,
              label: page.toString(),
              active: true
            },
            {
              url: page < lastPage ? `${config.BASE_URL}/admin/agents?page=${page + 1}&per_page=${perPage}` : null,
              label: "Next &raquo;",
              active: false
            }
          ],
          next_page_url: page < lastPage ? `${config.BASE_URL}/admin/agents?page=${page + 1}&per_page=${perPage}` : null,
          path: `${config.BASE_URL}/admin/agents`,
          per_page: perPage,
          prev_page_url: page > 1 ? `${config.BASE_URL}/admin/agents?page=${page - 1}&per_page=${perPage}` : null,
          to: paginatedAgents.length > 0 ? to : null,
          total: total,
        }
      }

      console.log('Transformed pagination response:', {
        total: paginatedResponse.data.total,
        current_page: paginatedResponse.data.current_page,
        last_page: paginatedResponse.data.last_page,
        per_page: paginatedResponse.data.per_page,
        agents_count: paginatedResponse.data.data.length
      })

      return NextResponse.json(paginatedResponse, { status: 200, headers })
    }

    // Fallback: pass through as-is
    return NextResponse.json(response.data, { status: 200, headers })
  } catch (error) {
    console.error('Error fetching agents:', error)
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}