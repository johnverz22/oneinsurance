import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { headers, timeout: 15000 })
      return response.data
    } catch (err: any) {
      const isSocketHangUp = err.message?.includes('socket hang up') || err.code === 'ECONNRESET'
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
      const isRetryable = isSocketHangUp || isTimeout || err.response?.status >= 500

      if (isRetryable && attempt < retries) {
        console.log(`Motor cache fetch attempt ${attempt} failed (${err.message}), retrying in ${RETRY_DELAY_MS}ms...`)
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt))
        continue
      }
      throw err
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cacheKey = searchParams.get('cacheKey')

    if (!cacheKey) {
      return NextResponse.json({ error: 'Cache key is required' }, { status: 400 })
    }

    const url = `${process.env.BASE_URL}/quote/compare/${cacheKey}`
    console.log('Motor Insurance Load Quote by Cache URL:', url)

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`,
    }

    const data = await fetchWithRetry(url, headers)
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error loading motor insurance quote by cache:', error.response?.data || error.message)
    if (axios.isAxiosError(error)) return handleServerSideAxiosError(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
