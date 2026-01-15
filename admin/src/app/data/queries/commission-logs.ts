import { useAuthStore } from '@/store/auth-store'
import { CommissionLogsPaginatedResponse } from '@/types/commission-logs'
import { handleApiError } from '@/utils/handle-api-error'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface CommissionLogsParams {
  page?: number
  per_page?: number
  sort_by?: 'created_at' | 'net_commission' | 'period_start'
  sort_order?: 'asc' | 'desc'
  agent_id?: string
  product_id?: string
  provider_id?: string
  period_start?: string
  period_end?: string
  min_commission?: number
  max_commission?: number
}

export function useGetCommissionLogs(params: CommissionLogsParams = {}) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['commission-logs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()

      if (params.page) searchParams.append('page', params.page.toString())
      else searchParams.append('page', '1')
      if (params.per_page)
        searchParams.append('per_page', params.per_page.toString())
      else searchParams.append('per_page', '15')
      if (params.sort_by) searchParams.append('sort_by', params.sort_by)
      else searchParams.append('sort_by', 'created_at')
      if (params.sort_order)
        searchParams.append('sort_order', params.sort_order)
      else searchParams.append('sort_order', 'desc')
      if (params.agent_id) searchParams.append('agent_id', params.agent_id)
      if (params.product_id)
        searchParams.append('product_id', params.product_id)
      if (params.provider_id)
        searchParams.append('provider_id', params.provider_id)
      if (params.period_start)
        searchParams.append('period_start', params.period_start)
      if (params.period_end)
        searchParams.append('period_end', params.period_end)
      if (params.min_commission)
        searchParams.append('min_commission', params.min_commission.toString())
      if (params.max_commission)
        searchParams.append('max_commission', params.max_commission.toString())

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/commission-logs?${searchParams.toString()}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<CommissionLogsPaginatedResponse>(url, {
          headers: {
            Authorization: token,
          },
        })

        if (!response.status.toString().startsWith('2')) {
          throw new Error('Failed to fetch commission logs')
        }

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
  })
}
