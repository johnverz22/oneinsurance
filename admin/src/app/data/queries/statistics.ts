import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

export interface AgentStatisticsResponse {
  total_sales: number
  number_of_sales: number
  gross_commissions: number
  net_commissions: number
  average_payout: number
  number_of_products: number
  product_sales_ranking: Array<{
    product_id: number
    product_name: string
    total_cases: number
    total_sales: number
  }>
}

export const useAgentStatistics = (dateFrom?: string, dateTo?: string, agentId?: number) => {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['agent-statistics', dateFrom, dateTo, agentId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (agentId) params.append('agent_id', agentId.toString())
      
      const url = `/api/admin/statistics?${params.toString()}`
      const token = `Bearer ${accessToken}`
      
      try {
        const response = await axios.get<AgentStatisticsResponse>(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        console.error('Error fetching agent statistics:', error)
        
        // If agent-specific statistics fail, return null instead of throwing
        if (axios.isAxiosError(error) && error.response?.status === 422 && agentId) {
          console.log('Agent-specific statistics not supported by backend, returning null')
          return null
        }
        
        throw error
      }
    },
    enabled: !!accessToken,
    // Don't retry on 422 errors for agent-specific requests
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 422 && agentId) {
        return false
      }
      return failureCount < 3
    },
  })
}
