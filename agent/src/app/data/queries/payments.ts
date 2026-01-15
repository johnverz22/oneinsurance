import { api } from '@/lib/axios'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { PaymentHistory, PaymentsSummary } from '@/types/agent/payments'
import { mapSnakeToCamel } from '@/utils/data-mapper'
import { getCurrentMonthRange } from '@/utils/date'
import { useQuery } from '@tanstack/react-query'

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
  const { user } = useAgentAuthStore()

  return useQuery({
    enabled: !!user?.id,
    initialData: [],
    queryKey: ['payments-history', user?.id, perPage, sortBy, sortOrder],
    queryFn: async () => {
      const response = await api.get<{ data: { data: PaymentHistory[] } }>(
        '/agents/commission-logs',
        {
          params: {
            per_page: perPage,
            sort_by: sortBy,
            sort_order: sortOrder,
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
  const { user } = useAgentAuthStore()
  const { currentFirstDate, currentLastDate } = getCurrentMonthRange()

  const start = periodStart ?? currentFirstDate
  const end = periodEnd ?? currentLastDate

  return useQuery({
    enabled: !!user?.id,
    queryKey: ['payments-summary', user?.id],
    select: mapSnakeToCamel,
    queryFn: async () => {
      const response = await api.get<{ data: PaymentsSummary }>(
        '/agent/commission-logs/summary',
        {
          params: {
            period_start: start,
            period_end: end,
          },
        }
      )

      return response.data.data
    },
  })
}
