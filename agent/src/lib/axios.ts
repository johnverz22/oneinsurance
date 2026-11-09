import { z } from 'zod'
import axios, { AxiosError } from 'axios'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { createAPIResponseSchema, getFirstErrorMessage } from '@/types/base-api-response'

/**
 * Axios instance pre-configured for the One Insurance backend API.
 * Attaches the bearer token from Zustand auth store on every request.
 * Handles 401 → logout + redirect, and unwraps API error messages.
 */
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
  (response) => response,

  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const { logout } = useAgentAuthStore.getState()
      logout()

      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      throw new Error('Session expired. Please sign in again.')
    }

    if (error.response?.data) {
      const parsed = createAPIResponseSchema(z.any()).safeParse(error.response.data)

      if (parsed.success && !parsed.data.success) {
        throw new Error(
          getFirstErrorMessage((parsed.data as { errors: Record<string, string[]> }).errors) ??
            (parsed.data as { message: string }).message
        )
      }
    }

    throw new Error('Something went wrong. Please try again.')
  }
)
