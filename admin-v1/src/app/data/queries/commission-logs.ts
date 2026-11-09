import { useAuthStore } from '@/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export interface CommissionLog {
  id: number
  agent_id: number
  product_id: number
  provider_id: number
  transaction_id: number
  case_count: number
  total_net_premium: string
  product_price: string
  commission_rate: string
  gross_commission: string
  vat_percentage: string
  vat_amount: string
  withholding_tax_percentage: string
  withholding_tax_amount: string
  net_commission: string
  base_commission: string
  agent_commission: string
  agent_overrider_commission: string
  agent_admin_commission: string
  agent_admin_overrider_commission: string
  referral_commission: string
  referral_overrider_commission: string
  referral_admin_commission: string
  referral_admin_overrider_commission: string
  is_included_in_payout: boolean
  payout_id: number | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  product?: {
    id: number
    name: string
    description?: string
  }
  provider?: {
    id: number
    name: string
  }
  transaction?: {
    id: number
    merchant_transaction_id: string
  }
}

export interface CommissionLogsResponse {
  success: boolean
  message: string
  data: {
    data: CommissionLog[]
    total: number
    current_page: number
    last_page: number
    per_page: number
  }
}

interface GetCommissionLogsParams {
  agent_id?: number
  page?: number
  per_page?: number
  is_included_in_payout?: boolean
}

export function useGetCommissionLogs(params?: GetCommissionLogsParams) {
  const { accessToken } = useAuthStore()
  
  if (!params) {
    return useQuery({
      queryKey: ['commission-logs'],
      queryFn: async () => null,
      enabled: false,
    })
  }

  const { agent_id, page = 1, per_page = 50, is_included_in_payout } = params

  return useQuery({
    queryKey: ['commission-logs', agent_id, page, per_page, is_included_in_payout],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (agent_id) searchParams.append('agent_id', agent_id.toString())
      searchParams.append('page', page.toString())
      searchParams.append('per_page', per_page.toString())
      if (is_included_in_payout !== undefined) {
        searchParams.append('is_included_in_payout', is_included_in_payout.toString())
      }

      try {
        const response = await axios.get<CommissionLogsResponse>(
          `/api/admin/commission-logs?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!accessToken && !!agent_id,
    staleTime: 5 * 60 * 1000,
  })
}
