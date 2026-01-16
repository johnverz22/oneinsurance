import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { useAgentAuthStore } from '@/store/agent-auth-store'
import { AgentProductPaginatedResponse } from '@/types/products'
import { mapAgentProductToMappedProduct } from '@/utils/data-mapper'

export function useGetProducts(lobId?: number) {
  const { accessToken } = useAgentAuthStore()

  return useQuery({
    queryKey: ['agentProducts', lobId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (lobId) params.append('lob_id', lobId.toString())

      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`
      const token = `Bearer ${accessToken}`

      const response = await axios.get<AgentProductPaginatedResponse>(url, {
        headers: {
          Authorization: token,
        },
      })

      const mappedProducts = response.data.data.data.map((agentProducts) => {
        return mapAgentProductToMappedProduct(agentProducts)
      })

      return mappedProducts
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!accessToken,
  })
}
