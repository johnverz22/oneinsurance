import { useAuthStore } from '@/store/auth-store'
import { AgentProductPaginatedResponse, AgentsResponse } from '@/types/agents'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useGetAgents(page = 1) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['agents', page],
    queryFn: async () => {
      try {
        const response = await axios.get<AgentsResponse>(
          `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agents?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        return response.data
      } catch (error) {
        console.error('Error fetching agents:', error)
        throw error
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
        console.error('Error fetching agent products:', error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  })
}
