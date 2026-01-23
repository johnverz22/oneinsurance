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

export const useAgentStatistics = (dateFrom: string, dateTo: string) => {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['agent-statistics', dateFrom, dateTo],
    queryFn: async () => {
      const url = `/api/admin/statistics?date_from=${dateFrom}&date_to=${dateTo}`
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
        throw error
      }
    },
    enabled: !!accessToken && !!dateFrom && !!dateTo,
  })
}
