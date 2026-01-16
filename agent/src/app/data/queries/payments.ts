import { useAgentAuthStore } from '@/store/agent-auth-store'
import { PaymentHistory, PaymentsSummary } from '@/types/agent/payments'
import { mapSnakeToCamel } from '@/utils/data-mapper'
import { getCurrentMonthRange } from '@/utils/date'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

type PaymentsHistoryParams = {
  perPage?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const usePaymentsHistory = ({
  perPage = 15,
  sortBy = 'created_at',
  sortOrder = 'desc',
}: PaymentsHistoryParams = {}) => {
  const { user, accessToken } = useAgentAuthStore()

  return useQuery({
    enabled: !!user?.id && !!accessToken,
    initialData: [],
    queryKey: ['payments-history', user?.id, perPage, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('per_page', perPage.toString())
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      const url = `/api/agent/commission-logs${params.toString() ? `?${params.toString()}` : ''}`

      const response = await axios.get<{ data: { data: PaymentHistory[] } }>(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      )

      const result = response.data.data
      return result.data
    },
  })
}

type PaymentsSummaryParams = {
  periodStart?: string
  periodEnd?: string
}

export const usePaymentSummary = ({
  periodStart,
  periodEnd,
}: PaymentsSummaryParams = {}) => {
  const { user, accessToken } = useAgentAuthStore()
  const { currentFirstDate, currentLastDate } = getCurrentMonthRange()

  const start = periodStart ?? currentFirstDate
  const end = periodEnd ?? currentLastDate

  return useQuery({
    enabled: !!user?.id && !!accessToken,
    queryKey: ['payments-summary', user?.id, start, end],
    select: mapSnakeToCamel,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('period_start', start)
      params.append('period_end', end)

      const url = `/api/agent/commission-logs/summary?${params.toString()}`

      const response = await axios.get<{ data: PaymentsSummary }>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      })

      return response.data.data
    },
  })
}
