import { AxiosError } from 'axios'
import { NextResponse } from 'next/server'

export function handleServerSideAxiosError(error: AxiosError) {
  // Extract safe data from error response
  const errorData = {
    message: error.message,
    status: error.status,
    data: error.response?.data,
    statusText: error.response?.statusText,
  }

  switch (error.status) {
    case 500:
      return NextResponse.json(
        { error: errorData },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    case 422:
      return NextResponse.json(
        { error: error.response?.data || 'Unprocessable Entity' },
        {
          status: 422,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    case 401:
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    default:
      return NextResponse.json(
        { error: errorData },
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
