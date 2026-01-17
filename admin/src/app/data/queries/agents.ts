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
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  status?: string
}

export function useGetAgents(params: GetAgentsParams = {}) {
  const { accessToken } = useAuthStore()
  const { page = 1, per_page = 15, search, sort_by, sort_order, status } = params

  return useQuery({
    queryKey: ['agents', page, per_page, search, sort_by, sort_order, status],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.append('page', page.toString())
      searchParams.append('per_page', per_page.toString())
      if (search) searchParams.append('search', search)
      if (sort_by) searchParams.append('sort_by', sort_by)
      if (sort_order) searchParams.append('sort_order', sort_order)
      if (status) searchParams.append('status', status)

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

export function useGetAgentById(agentId: number | null) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['agent-detail', agentId],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents/${agentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        console.log('=== AGENT DETAIL API RESPONSE ===')
        console.log('Full Response:', JSON.stringify(response.data, null, 2))
        console.log('Response Object:', response.data)
        console.log('================================')

        return response.data
      } catch (error) {
        console.error('Error fetching agent details:', error)
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken && !!agentId,
    staleTime: 5 * 60 * 1000,
  })
}
