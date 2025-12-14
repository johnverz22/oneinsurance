import { useAuthStore } from '@/store/auth-store'
import {
  CommissionConfigUpdateRequest,
  CommissionConfigUpdateResponse,
  CreateCommitionConfigRequest,
} from '@/types/commission'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useUpdateCommissionConfiguration() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['update-commission-configuration'],
    mutationFn: async ({
      data,
      commissionConfigId,
    }: {
      data: CommissionConfigUpdateRequest
      commissionConfigId: number
    }) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/commission-configurations/${commissionConfigId}`
        const token = `Bearer ${accessToken}`
        const response = await axios.put<CommissionConfigUpdateResponse>(
          url,
          data,
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

export function useCreateCommissionConfiguration() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['create-commission-configuration'],
    mutationFn: async (payload: CreateCommitionConfigRequest) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/commission-configurations`
        const token = `Bearer ${accessToken}`
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
