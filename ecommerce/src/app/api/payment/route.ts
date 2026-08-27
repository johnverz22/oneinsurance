import { NextRequest, NextResponse } from 'next/server'
import { PaymentAuthRequest, PaymentAuthResponse } from '@/types/payment'
import axios from 'axios'
import { handleServerSideAxiosError } from '@/utils/server-side-axios-error-handler'
import { getTokenFromDB, saveTokenToDB } from '@/app/api/payment/database'
import crypto from 'crypto'
import { headers } from 'next/headers'

// Generate a proper 32-byte key for AES-256
const secretKey = process.env.SECRET_KEY
if (!secretKey) throw new Error('SECRET_KEY environment variable is not set')
const keyInBytes = crypto.createHash('sha256').update(secretKey).digest()

type paymentAuthTokenDB = {
  paymentAuth: PaymentAuthResponse
  expiresAt: Date
}

function encrypt(paymentAuth: PaymentAuthResponse, expiresAt: Date): string {
  const data: paymentAuthTokenDB = { paymentAuth, expiresAt }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', keyInBytes, iv)
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

function decrypt(encryptedText: string | null): paymentAuthTokenDB | null {
  if (!encryptedText) return null

  try {
    const [ivHex, encrypted] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyInBytes, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return JSON.parse(decrypted) as paymentAuthTokenDB
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

function isTokenValid(expiresAt: Date): boolean {
  return new Date() < new Date(expiresAt)
}

function calculateExpireAt(expire_in: number): Date {
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + expire_in)
  return expiresAt
}

async function getToken(): Promise<PaymentAuthResponse | null> {
  // get the latest token in database
  const token = await getTokenFromDB()
  const paymentAuth = decrypt(token)
  // return the token from databse if it is still valid
  if (paymentAuth && isTokenValid(paymentAuth.expiresAt)) {
    return paymentAuth.paymentAuth
  }

  const payload: PaymentAuthRequest = {
    grant_type: 'client_credentials',
    client_id: process.env.PAYMENT_CLIENT_ID || '',
    client_secret: process.env.PAYMENT_CLIENT_SECRET || '',
    scope: '',
  }
  const url = `${process.env.PAYMENT_BASE_URL}/oauth/token`
  try {
    const response = await axios.post<PaymentAuthResponse>(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    const expireAt = calculateExpireAt(response.data.expires_in)
    // save the new token to database
    const encryptedToken = await encrypt(response.data, expireAt)
    await saveTokenToDB(encryptedToken)

    return response.data
  } catch (error: any) {
    console.error('Payment auth error:', error)
    return null
  }
}

// get the auth access token
export async function POST() {
  const token = await getToken()
  if (!token) {
    console.log('invalid token')
    return NextResponse.json(
      { message: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }

  return NextResponse.json(token, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(req: NextRequest) {
  const token = await getToken()
  if (!token) {
    console.log('invalid token')
    return NextResponse.json(
      { message: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }

  // DLT v1.3+: brands endpoint uses query params, not path segments
  const url = new URL(`${process.env.PAYMENT_BASE_URL}/api/v1/collection/apn/brands`)
  url.searchParams.set('merchant_account_id', process.env.MERCHANT_ACCOUNT_ID || '')
  url.searchParams.set('service_code', process.env.PAYMENT_SERVICE_CODE || '')

  try {
    const response = await axios.get(url.toString(), {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/json',
      },
      timeout: 10000, // 10 second timeout
      // Add retry logic for network errors
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    })

    return NextResponse.json(response.data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error: any) {
    console.log('Get payment option error:', error)
    
    // Handle specific network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('Network connectivity issue with payment gateway:', error.message)
      return NextResponse.json(
        { 
          message: 'Unable to connect to payment gateway. Please try again later.',
          error: 'NETWORK_ERROR'
        },
        {
          status: 503, // Service Unavailable
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    }
    
    if (axios.isAxiosError(error)) {
      return handleServerSideAxiosError(error)
    }

    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      {
        status: error.status || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }
}
