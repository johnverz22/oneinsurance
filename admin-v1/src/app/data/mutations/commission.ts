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
        const response = await axios.put<CommissionConfigUpdateResponse>(
          `/api/admin/commission-configurations/${commissionConfigId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
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
        const response = await axios.post(
          `/api/admin/commission-configurations`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
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
