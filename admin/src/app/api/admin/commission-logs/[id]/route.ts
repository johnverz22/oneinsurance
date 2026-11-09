import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import {
  BASE_URL,
  buildApiHeaders,
  getAuthToken,
  handleAxiosError,
  unauthorized,
} from '@/lib/api-helpers'

/**
 * Single commission log. Falls back to scanning the full list when the
 * by-ID endpoint does not resolve the record.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  const { id } = await params
  const headers = { Authorization: token, Accept: 'application/json' }

  try {
    const res = await axios.get(`${BASE_URL}/admin/commission-logs/${id}`, { headers })
    return NextResponse.json(res.data, {
      status: res.status,
      headers: buildApiHeaders(req),
    })
  } catch {
    // fall through to list lookup
  }

  try {
    const res = await axios.get(`${BASE_URL}/admin/commission-logs?per_page=100`, { headers })
    const list = res.data?.data?.data ?? res.data?.data ?? []
    const match = Array.isArray(list)
      ? list.find((c: { id?: number | string }) => String(c.id) === id)
      : null

    if (match) {
      return NextResponse.json(
        { success: true, message: 'Commission log found', data: match },
        { status: 200, headers: buildApiHeaders(req) }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Commission log not found' },
      { status: 404, headers: buildApiHeaders(req) }
    )
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch commission log' },
      { status: 500, headers: buildApiHeaders(req) }
    )
  }
}
