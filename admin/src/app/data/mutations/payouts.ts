import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'
import { handleApiError } from '@/utils/handle-api-error'

export interface GeneratePayoutsPayload {
  date_from: string // Date in YYYY-MM-DD format
  date_to: string // Date in YYYY-MM-DD format
}

export interface PayoutResponse {
  success: boolean
  message: string
  data: {
    payouts_generated: number
    total_amount: number
    date_from: string
    date_to: string
  }
}

export interface CreatePayoutPayload {
  agent_id: number
  payout_amount: number
  payout_type: string
  payment_method: string
  payout_date: string // Date in YYYY-MM-DD format
  commission_log_ids: number[]
  notes?: string
}

export interface CreatePayoutResponse {
  success: boolean
  message: string
  data: {
    id: number
    payout_reference: string
    agent_id: number
    payout_amount: number
    status: string
    created_at: string
  }
}

export function useGeneratePayouts() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: GeneratePayoutsPayload) => {
      try {
        const response = await axios.post<PayoutResponse>(
          '/api/admin/payouts',
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate payouts and commission logs queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['payouts'] })
      queryClient.invalidateQueries({ queryKey: ['commission-logs'] })
    },
  })
}

export function useCreatePayout() {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreatePayoutPayload) => {
      try {
        // Try to create payout directly via backend
        // If backend doesn't have this endpoint, it will need to be added
        const response = await axios.post<CreatePayoutResponse>(
          '/api/admin/payouts/individual',
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate payouts and commission logs queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['payouts'] })
      queryClient.invalidateQueries({ queryKey: ['commission-logs'] })
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] })
    },
  })
}

