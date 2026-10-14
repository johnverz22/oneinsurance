import { z } from 'zod'
import axios, { AxiosError } from 'axios'
import {
  createAPIResponseSchema,
  getFirstErrorMessage,
} from '@/types/base-api-response'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 30_000, // 30 s — prevents hanging indefinitely
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => {
    return response
  },

  (error: AxiosError) => {
    if (error.response?.data) {
      const parsed = createAPIResponseSchema(z.any()).safeParse(
        error.response.data
      )

      if (parsed.success && !parsed.data.success) {
        throw new Error(
          getFirstErrorMessage(parsed.data.errors) ?? parsed.data.message
        )
      }
    }

    // Distinguish timeout from other network failures for clearer feedback
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('The request timed out. Please check your connection and try again.')
    }

    if (!error.response) {
      throw new Error('Unable to reach the server. Please check your connection and try again.')
    }

    throw new Error('Something went wrong. Please try again.')
  }
)
