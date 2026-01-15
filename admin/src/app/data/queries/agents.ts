import { useAuthStore } from '@/store/auth-store'
import { AgentProductPaginatedResponse, AgentsResponse } from '@/types/agents'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

interface GetAgentsParams {
  page?: number
  per_page?: number
  search?: string
}

export function useGetAgents(params: GetAgentsParams = {}) {
  const { accessToken } = useAuthStore()
  const { page = 1, per_page = 15, search } = params

  return useQuery({
    queryKey: ['agents', page, per_page, search],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.append('page', page.toString())
      searchParams.append('per_page', per_page.toString())
      if (search) searchParams.append('search', search)

      try {
        const response = await axios.get<AgentsResponse>(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents?${searchParams.toString()}`,
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
    refetchOnWindowFocus: false,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGetAgentProducts(page: number = 1) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['agent-products', page],
    queryFn: async () => {
      try {
        const response = await axios.get<AgentProductPaginatedResponse>(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agent-products?page=${page}`,
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
    refetchOnWindowFocus: false,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })
}
