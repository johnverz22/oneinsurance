import { useAuthStore } from '@/store/auth-store'
import { AgentsResponse } from '@/types/agents'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useDeleteAgent() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['delete-agent'],
    mutationFn: async (agentId: number) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents/${agentId}`
        const response = await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export function useActivateAgent() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['activate-agent'],
    mutationFn: async (agentId: number) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/activate-account`
        const response = await axios.post(
          url,
          { user_id: agentId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export function useUpdateAgent() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['update-agent'],
    mutationFn: async ({
      agentId,
      payload,
    }: {
      agentId: number
      payload: any
    }) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents/${agentId}`
        const response = await axios.put(url, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export function useSearchAgents() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['search-agents'],
    mutationFn: async ({ searchKey }: { searchKey: string }) => {
      try {
        const response = await axios.post<AgentsResponse>(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents/search`,
          {
            keyword: searchKey,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    retry: false,
  })
}

export function useSendSignupLink() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['send-signup-link'],
    mutationFn: async ({ email }: { email: string }) => {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/invitations`,
          {
            email: email,
            role: 'agent',
            invitation_url: 'https://affiliate.intel-soln.com.ph/signup'
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        )

        return response.data
      } catch (error) {
        // Handle 401 errors with the standard handler
        if (error instanceof AxiosError && error.response?.status === 401) {
          handleApiError(error)
        }
        
        // For other errors, throw with the original error for custom handling
        throw error
      }
    },
  })
}
