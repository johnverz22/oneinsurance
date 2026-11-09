import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, buildApiHeaders, getAuthToken, unauthorized } from '@/lib/api-helpers'

/**
 * Profile photo upload / delete.
 *
 * Previously this route wrote the photo to the Next.js local filesystem
 * (public/uploads/profiles/) which broke in staging because the container
 * filesystem is ephemeral.
 *
 * Now the photo is uploaded directly to the backend via POST /agents/files/upload
 * with tag "profile_photo".  The backend stores it on Google Drive and returns
 * the file record.  The photo URL stored on the user profile is a proxy URL
 * pointing to our own /api/agent/files/[id]/serve endpoint so it renders
 * reliably without exposing a Google Drive auth cookie requirement.
 */

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * POST /api/agent/profile/photo
 *
 * Body (multipart/form-data):
 *   photo  File  — the new profile photo
 *
 * Response:
 *   { success: true, data: { profile_photo_url: string } }
 *
 * The returned profile_photo_url is a relative Next.js proxy path of the form
 * /api/agent/files/<id>/serve  so it works in any environment.
 */
export async function POST(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    const formData = await req.formData()
    const photo = formData.get('photo') as File | null

    if (!photo || typeof photo === 'string')
      return NextResponse.json(
        { success: false, message: 'No photo provided' },
        { status: 400, headers }
      )

    const isImage =
      photo.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|avif)$/i.test(photo.name)

    if (!isImage)
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload an image.' },
        { status: 400, headers }
      )

    if (photo.size > MAX_BYTES)
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 5 MB.' },
        { status: 400, headers }
      )

    // Generate an opaque filename: "profile_photo__<8-char random hex>.<ext>"
    // The original client filename is discarded — the tag prefix is all that matters.
    const ext = photo.type === 'image/png' ? 'png'
      : photo.type === 'image/webp' ? 'webp'
      : photo.type === 'image/gif' ? 'gif'
      : photo.type === 'image/avif' ? 'avif'
      : 'jpg'
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const fileName = `profile_photo__${randomHex}.${ext}`

    const outbound = new FormData()
    outbound.append('file', photo)
    outbound.append('file_name', fileName)
    outbound.append('tag', 'profile_photo')

    const upstreamRes = await fetch(`${BASE_URL}/agents/files/upload`, {
      method: 'POST',
      headers: { Authorization: token, Accept: 'application/json' },
      body: outbound,
    })

    const data = await upstreamRes.json().catch(() => null)

    if (!upstreamRes.ok)
      return NextResponse.json(
        data || { success: false, message: 'Photo upload failed' },
        { status: upstreamRes.status, headers }
      )

    const raw = data?.data ?? data
    const fileId = raw?.id

    if (!fileId)
      return NextResponse.json(
        { success: false, message: 'Upload succeeded but file ID was missing in response' },
        { status: 500, headers }
      )

    // Build a proxy URL that goes through our serve route — works in all envs
    const proxyUrl = `/api/agent/files/${fileId}/serve`

    // Persist the proxy URL on the backend agent profile so it is returned
    // on subsequent profile fetches.
    await updateProfilePhotoUrl(token, proxyUrl)

    return NextResponse.json(
      {
        success: true,
        message: 'Profile photo updated successfully',
        data: { profile_photo_url: proxyUrl },
      },
      { status: 200, headers }
    )
  } catch (error: any) {
    console.error('[profile/photo] POST error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload photo' },
      { status: 500, headers }
    )
  }
}

/**
 * DELETE /api/agent/profile/photo
 *
 * Clears the profile_photo_url on the backend profile record.
 * Does not delete the underlying Drive file (leave that to the user if needed).
 */
export async function DELETE(req: NextRequest) {
  const headers = buildApiHeaders(req)
  const token = getAuthToken(req)
  if (!token) return unauthorized(req)

  try {
    await updateProfilePhotoUrl(token, null)

    return NextResponse.json(
      { success: true, message: 'Profile photo removed' },
      { status: 200, headers }
    )
  } catch (error: any) {
    console.error('[profile/photo] DELETE error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to remove photo' },
      { status: 500, headers }
    )
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Attempt to persist the profile_photo_url field on the agent profile.
 * Tries /agents/profile first, falls back to /profile silently.
 */
async function updateProfilePhotoUrl(
  token: string,
  url: string | null
): Promise<void> {
  const payload = JSON.stringify({ profile_photo_url: url })
  const reqHeaders = {
    Authorization: token,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  try {
    const res = await fetch(`${BASE_URL}/agents/profile`, {
      method: 'PUT',
      headers: reqHeaders,
      body: payload,
    })
    if (res.ok) return
  } catch {
    // fall through to secondary endpoint
  }

  try {
    await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: reqHeaders,
      body: payload,
    })
  } catch (err) {
    // Non-fatal — the file has been uploaded; the profile link is best-effort
    console.warn('[profile/photo] Could not persist profile_photo_url:', err)
  }
}
