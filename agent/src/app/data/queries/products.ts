import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { useAgentAuthStore } from '@/store/agent-auth-store'
import { AgentProductPaginatedResponse } from '@/types/products'

export function useGetProducts() {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['agentProducts'],
    queryFn: async () => {
      const url = `/api/products`
      const token = `Bearer ${accessToken}`

      const response = await axios.get<AgentProductPaginatedResponse>(url, {
        headers: {
          Authorization: token,
        },
      })

      return response.data
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!accessToken,
  })
}
