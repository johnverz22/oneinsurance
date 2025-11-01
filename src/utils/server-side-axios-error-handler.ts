import { AxiosError } from 'axios'
import { NextResponse } from 'next/server'

export function handleServerSideAxiosError(error: AxiosError) {
  switch (error.status) {
    case 500:
      return NextResponse.json(
        error.response?.data || { error: 'Internal Server Error' },
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
        error.response?.data || { error: 'Unprocessable Entity' },
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
        error.response?.data || { error: 'Unauthorized' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    case 400:
      console.log(error.response?.data)
      return NextResponse.json(
        error.response?.data || { message: 'Bad Request' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      )
    default:
      return NextResponse.json(error.response?.data || 'Unknown Error', {
        status: error.status || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
  }
}
