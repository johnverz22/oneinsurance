import { useAuthStore } from '@/store/auth-store'
import { GetPayoutResponse } from '@/types/payout'
import { handleApiError } from '@/utils/handle-api-error'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

// PAYOUT MANAGEMENT

export function useExportPayoutsCsv(dateFrom: string, dateTo: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['exportPayoutsCsv'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/export?date_from=${dateFrom}&date_to=${dateTo}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken && !!dateFrom && !!dateTo,
  })
}

export function useGetPayouts(dateFrom?: string, dateTo?: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getAllPayouts', dateFrom, dateTo],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (dateFrom) {
        queryParams.append('date_from', dateFrom)
      }
      if (dateTo) {
        queryParams.append('date_to', dateTo)
      }
      const url =
        `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts` +
        (queryParams.toString().length > 0 ? `?${queryParams.toString()}` : '')
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get<GetPayoutResponse>(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGetPayoutDetails(payoutId: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getPayoutDetails', payoutId],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/${payoutId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGetPayoutAudit(payoutId: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getPayoutAudit', payoutId],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/${payoutId}/history`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGetPayoutFilterByStatus(status: 'pending' | 'completed') {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getPayoutFilterByStatus', status],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/${status}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGetPayoutStatistics(dateFrom: string, dateTo: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getPayoutStatistics', dateFrom, dateTo],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/statistics?date_from=${dateFrom}&date_to=${dateTo}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken && !!dateFrom && !!dateTo,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGetAgentPayoutStatistics(
  agentId: string,
  dateFrom: string,
  dateTo: string
) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getAgentPayoutStatistics', agentId, dateFrom, dateTo],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/agents/${agentId}/statistics?date_from=${dateFrom}&date_to=${dateTo}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken && !!agentId && !!dateFrom && !!dateTo,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

// PAYOUT CONFIGURATION

export function useGetPayoutConfigurations(
  page: number = 1,
  perPage: number = 15
) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getPayoutConfigurations'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations?page=${page}&per_page=${perPage}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGetActivePayoutConfiguration() {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getActivePayoutConfiguration'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/active`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

export function useShowPayoutConfigurationDetails(configId: string) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['showPayoutConfigurationDetails', configId],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!accessToken,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  })
}

// AGENT RESTRICTION
export function useGetAgentRestictions(
  configId: string,
  page: number = 1,
  perPage: number = 15
) {
  const { accessToken } = useAuthStore()
  return useQuery({
    queryKey: ['getAgentRestrictions', configId, page, perPage],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}/restrictions?page=${page}&per_page=${perPage}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
