import { z } from 'zod'
import axios, { AxiosError } from 'axios'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import {
  createAPIResponseSchema,
  getFirstErrorMessage,
} from '@/types/base-api-response'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAgentAuthStore.getState()

  if (accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
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

    throw new Error('Something went wrong. Please try again.')
  }
)
