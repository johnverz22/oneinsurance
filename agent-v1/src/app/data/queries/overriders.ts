import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Overrider } from '@/types/agent/overrider'

type OverridersStatistics = {
  total_overriders: number
  active_overriders: number
  total_sales_generated: number
  monthly_deduction: number
}

type OverridersResponse = {
  success: boolean
  message: string
  data: {
    statistics: OverridersStatistics
    overriders: Overrider[]
  }
}

export const useGetOverriders = () => {
  return useQuery<OverridersResponse>({
    queryKey: ['overriders'],
    queryFn: async () => {
      const response = await axios.get('/api/agent/overriders')
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}
