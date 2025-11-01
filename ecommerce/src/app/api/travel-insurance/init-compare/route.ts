'use server'

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { InitCompareQuote, TravelInsuranceApiResponse } from '@/types/plan'

// Custom error class for polling timeout
class PollingTimeoutError extends Error {
  public readonly code: string
  public readonly retries: number
  public readonly maxRetries: number

  constructor(message: string, retries: number, maxRetries: number) {
    super(message)
    this.name = 'PollingTimeoutError'
    this.code = 'POLLING_TIMEOUT'
    this.retries = retries
    this.maxRetries = maxRetries

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PollingTimeoutError)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    const url = `${process.env.BASE_URL}/quote/travel/compare-quote`
    const token = req.headers.get('Authorization')

    console.log(JSON.stringify(data))

    const result = await axios.post<InitCompareQuote>(url, data, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    })

    if (!result.data) {
      throw new Error('Init compare')
    }

    // Use NextResponse.json for proper JSON handling
    return NextResponse.json(result.data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.log('Init Compare', error)
    if (axios.isAxiosError(error)) {
      switch (error.status) {
        case 500:
          return NextResponse.json(
            { message: error },
            {
              status: 500,
            }
          )
        case 422:
          return NextResponse.json(
            error.response?.data || { message: 'Unprocessable Entity' },
            { status: 422 }
          )
        case 401:
          return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
    }

    throw NextResponse.json(error, { status: error.status })
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')
    const clientRequestId = req.nextUrl.searchParams.get('ClientRequestId')
    const url = `${process.env.BASE_URL}/quote/travel/compare-quote?ClientRequestId=${clientRequestId}`

    // Create an AbortController for the request
    const controller = new AbortController()

    // Handle client disconnect
    req.signal?.addEventListener('abort', () => {
      console.log('Client disconnected, aborting travel quote request')
      controller.abort()
    })

    const data = await pollForResult(url, token!, controller.signal)
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  } catch (error: any) {
    console.log('Compare Quote', error)

    // Handle request cancellation
    if (
      error.name === 'AbortError' ||
      axios.isCancel(error) ||
      error?.message === 'Request was cancelled' ||
      error?.message?.includes('cancelled')
    ) {
      console.log('Request was cancelled by client')
      return NextResponse.json(
        { message: 'Request cancelled by client' },
        { status: 499 } // Client Closed Request
      )
    }

    // Handle custom polling timeout error
    if (error instanceof PollingTimeoutError) {
      return NextResponse.json(
        {
          message:
            'Request timeout: Unable to process your quote request. Please try again.',
          error: 'POLLING_TIMEOUT',
          details: {
            retries: error.retries,
            maxRetries: error.maxRetries,
          },
        },
        { status: 408 } // Request Timeout
      )
    }

    if (axios.isAxiosError(error)) {
      switch (error.status) {
        case 500:
          return NextResponse.json(
            { message: 'Server is currently down' },
            {
              status: 500,
            }
          )
        case 422:
          return NextResponse.json(
            error.response?.data || { message: 'Unprocessable Entity' },
            { status: 422 }
          )
        case 401:
          return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
    }

    // Handle any other errors
    return NextResponse.json(
      {
        message: error?.message || 'An unexpected error occurred',
        error: error?.name || 'Unknown Error',
      },
      { status: error?.status || 500 }
    )
  }
}

const pollForResult = async (
  url: string,
  token: string,
  signal?: AbortSignal,
  maxRetries: number = 60,
  pollInterval: number = 1000
): Promise<TravelInsuranceApiResponse> => {
  let retries = 0

  while (retries < maxRetries) {
    try {
      // Check if the request was cancelled before making the call
      if (signal?.aborted) {
        throw new Error('Request was cancelled')
      }

      const result = await axios.get<TravelInsuranceApiResponse>(url, {
        headers: { Authorization: token },
        timeout: 1000 * 60 * 5,
        signal, // Pass the signal to axios
      })

      // If we get a successful response with data, return it
      if (result.status === 200 && result.data) {
        return result.data
      }

      // If status is 204, the resource is not ready yet
      if (result.status === 204) {
        console.log(`Polling attempt ${retries + 1}, resource not ready yet...`)
        retries++

        // Check for cancellation before waiting
        if (signal?.aborted) {
          throw new Error('Request was cancelled')
        }

        // Wait before next poll
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, pollInterval)

          // Listen for abort signal during the wait
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timeoutId)
              reject(new Error('Request was cancelled'))
            })
          }
        })
        continue
      }

      // Handle other status codes
      throw new Error(`Unexpected status code: ${result.status}`)
    } catch (error: any) {
      // Handle cancellation
      if (
        axios.isCancel(error) ||
        error?.message === 'Request was cancelled' ||
        error?.name === 'AbortError' ||
        signal?.aborted
      ) {
        console.log('Polling cancelled by client')
        const cancelError = new Error('Request was cancelled')
        cancelError.name = 'AbortError'
        throw cancelError
      }

      // Handle timeout or network errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.log('Request timeout, retrying...', error)
      } else {
        console.error('Polling error:', error)
        throw error
      }

      retries++
      if (retries >= maxRetries) {
        throw new PollingTimeoutError(
          `Polling timeout: Resource not available after ${maxRetries} attempts`,
          retries,
          maxRetries
        )
      }

      // Check for cancellation before waiting
      if (signal?.aborted) {
        throw new Error('Request was cancelled')
      }

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, pollInterval)

        // Listen for abort signal during the wait
        if (signal) {
          signal.addEventListener('abort', () => {
            clearTimeout(timeoutId)
            reject(new Error('Request was cancelled'))
          })
        }
      })
    }
  }

  throw new PollingTimeoutError(
    `Polling timeout: Resource not available after ${maxRetries} attempts (${retries} retries made)`,
    retries,
    maxRetries
  )
}
