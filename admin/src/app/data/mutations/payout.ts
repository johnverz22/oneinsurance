import { useAuthStore } from '@/store/auth-store'
import { handleApiError } from '@/utils/handle-api-error'
import { useMutation } from '@tanstack/react-query'
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
