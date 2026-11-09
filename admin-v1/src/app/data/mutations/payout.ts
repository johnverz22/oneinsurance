import { useAuthStore } from '@/store/auth-store'
import { GeneratePayoutResponse } from '@/types/payout'
import { handleApiError } from '@/utils/handle-api-error'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

// PAYOUT MANAGEMENT

export type GeneratePayoutRequest = {
  date_from: string
  date_to: string
}
export function useGeneratePayout() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['generatePayout'],
    mutationFn: async (payload: GeneratePayoutRequest) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/generate`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.post<GeneratePayoutResponse>(
          url,
          payload,
          {
            headers: {
              Authorization: token,
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export type UpdatePayoutStatusRequest = {
  status: string
  notes?: string
}
export function useUpdatePayoutStatus() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['updatePayoutStatus'],
    mutationFn: async ({
      payoutId,
      updatePayoutStatusRequest,
    }: {
      payoutId: string
      updatePayoutStatusRequest: UpdatePayoutStatusRequest
    }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/${payoutId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.patch(url, updatePayoutStatusRequest, {
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

export function useDeletePayout() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['deletePayout'],
    mutationFn: async (payoutId: string) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/${payoutId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.delete(url, {
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

export type BulkUpdatePayoutStatusRequest = {
  payout_ids: string[]
  status: string
}
export function useBulkUpdatePayoutStatus() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['bulkUpdatePayoutStatus'],
    mutationFn: async (payload: BulkUpdatePayoutStatusRequest) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/bulk-update-status`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.post(url, payload, {
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

export function useUploadPayoutCsv() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['uploadPayoutCsv'],
    mutationFn: async (file: File) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payouts/upload`
      const token = `Bearer ${accessToken}`
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post(url, formData, {
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

// PAYOUT CONFIGURATION

export type PayoutConfigurationRequest = {
  min_payout_amount: number
  max_payout_amount: number
  description: string
  is_active: boolean
}
export function useCreatePayoutConfiguration() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['createPayoutConfiguration'],
    mutationFn: async (payload: PayoutConfigurationRequest) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.post(url, payload, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getPayoutConfigurations'],
      })
    },
  })
}

export function useUpdatePayoutConfiguration() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['updatePayoutConfiguration'],
    mutationFn: async ({
      configId,
      config,
    }: {
      configId: string
      config: PayoutConfigurationRequest
    }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.patch(url, config, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getPayoutConfigurations'],
      })
    },
  })
}

export function useDeletePayoutConfiguration() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['deletePayoutConfiguration'],
    mutationFn: async (configId: string) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.delete(url, {
          headers: {
            Authorization: token,
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getPayoutConfigurations'],
      })
    },
  })
}

// AGENTS RESTRICTIONS
export type AgentPayoutRestrictionRequest = {
  agent_id: number
  restriction_type: 'excluded' | 'limited' | 'manual_approval_required'
  reason: string
  is_active: boolean
}
export function useSetAgentPayoutRestriction() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['setAgentPayoutRestriction'],
    mutationFn: async ({
      configId,
      payload,
    }: {
      configId: number
      payload: AgentPayoutRestrictionRequest
    }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}/restrictions`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.post(url, payload, {
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

export type UpdateAgentPayoutRestrictionRequest = Omit<
  AgentPayoutRestrictionRequest,
  'agent_id'
>
export function useUpdateAgentPayoutRestriction() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['updateAgentPayoutRestriction'],
    mutationFn: async ({
      configId,
      restrictionId,
      payload,
    }: {
      configId: number
      restrictionId: number
      payload: UpdateAgentPayoutRestrictionRequest
    }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}/restrictions/${restrictionId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.patch(url, payload, {
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

export function useDeleteAgentPayoutRestriction() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['deleteAgentPayoutRestriction'],
    mutationFn: async ({
      configId,
      restrictionId,
    }: {
      configId: number
      restrictionId: number
    }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/payout-configurations/${configId}/restrictions/${restrictionId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.delete(url, {
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
