import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import {
  BASE_URL,
  buildApiHeaders,
  getAuthToken,
  handleAxiosError,
  proxyApiRequest,
  unauthorized,
} from '@/lib/api-helpers'

type Ctx = { params: Promise<{ id: string }> }

/** Upload a user's profile photo (multipart passthrough). */
export async function POST(req: NextRequest, { params }: Ctx) {
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('profile_photo')

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: 'No file provided' },
      { status: 400, headers: buildApiHeaders(req) }
    )
  }

  const upstream = new FormData()
  upstream.append('profile_photo', file)

  try {
    const res = await axios.post(
      `${BASE_URL}/admin/users/${id}/photo`,
      upstream,
      { headers: { Authorization: token } }
    )
    return NextResponse.json(res.data, {
      status: res.status,
      headers: buildApiHeaders(req),
    })
  } catch (error) {
    if (axios.isAxiosError(error)) return handleAxiosError(error, req)
    return NextResponse.json(
      { success: false, message: 'Photo upload failed' },
      { status: 500, headers: buildApiHeaders(req) }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  return proxyApiRequest(req, `/admin/users/${id}/photo`)
}
