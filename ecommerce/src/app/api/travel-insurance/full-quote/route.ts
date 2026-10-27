import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Expand bracket-notation FormData keys back into a nested object.
 *
 * "travellers[0][first_name]"   → obj.travellers[0].first_name
 * "custom_field[plan_name]"     → obj.custom_field.plan_name
 * "client_request_id"           → obj.client_request_id
 *
 * Booleans sent as "1"/"0" by the browser (multipart can't send real booleans)
 * are left as strings here; the upstream IGW accepts "1"/"0" for boolean fields
 * in the JSON body.  If the upstream ever requires true/false, add a coerce
 * pass after expandFormDataToObject().
 */
function expandFormDataToObject(formData: FormData): Record<string, unknown> {
  const root: Record<string, unknown> = {}

  for (const [rawKey, rawValue] of formData.entries()) {
    // Skip file fields — file upload to the upstream is not yet wired.
    if (rawValue instanceof File) continue

    // Turn "travellers[0][first_name]" → segments ["travellers", 0, "first_name"]
    const parts: Array<string | number> = []
    const plain = rawKey.replace(/\[([^\]]*)\]/g, (_, k) => `.${k}`)
    for (const seg of plain.split('.')) {
      const n = Number(seg)
      parts.push(Number.isNaN(n) ? seg : n)
    }

    // Walk / create the path in root
    let cur: Record<string, unknown> = root
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]
      const nextKey = parts[i + 1]
      if (cur[key] === undefined || cur[key] === null) {
        cur[key] = typeof nextKey === 'number' ? [] : {}
      }
      cur = cur[key] as Record<string, unknown>
    }

    const last = parts[parts.length - 1]
    cur[last] = rawValue
  }

  return root
}

/**
 * BFF — POST /api/travel-insurance/full-quote
 *
 * The browser mutation (useFullQuoteRequest) always sends multipart/form-data
 * so it can optionally include ID image files.  The upstream IGW endpoint
 * expects application/json.
 *
 * This handler:
 *  1. Detects the incoming content-type.
 *  2. If multipart → parses FormData and reconstructs the nested JSON body
 *     from bracket-notation field names.
 *  3. Forwards the JSON body to:
 *       POST {BASE_URL}/travel/full-quote
 *     with Content-Type: application/json and the server-side Bearer token.
 *
 * BASE_URL = https://stage-api.oneinsurance.shop/api/v1  (no /igw — dropped Oct 2026)
 *
 * The full-quote body shape (docs/api_docs_latest/full-quote-fe.md):
 *   { client_request_id, agent_code, insurer_code, product_code, plan_code,
 *     travellers[], custom_field: { plan_name, id_images[] } }
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.BASE_URL) {
      console.error('BASE_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error: BASE_URL is not set' },
        { status: 500 }
      )
    }

    const url = `${process.env.BASE_URL}/travel/full-quote`

    const contentType = req.headers.get('content-type') ?? ''

    let jsonBody: Record<string, unknown>

    if (contentType.includes('multipart/form-data')) {
      // Parse multipart and reconstruct the nested object the upstream expects.
      const formData = await req.formData()
      jsonBody = expandFormDataToObject(formData)
    } else {
      // Plain JSON — direct API tests or future callers
      jsonBody = await req.json()
    }

    const response = await axios.post(url, jsonBody, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_TOKEN}`,
      },
    })

    // Forward the real status — 201 on success, errors handled in catch.
    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    console.error('Error fetching travel insurance full quote:', error)

    if (axios.isAxiosError(error)) {
      console.error(
        'Backend Error Response:',
        JSON.stringify({
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        })
      )
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
