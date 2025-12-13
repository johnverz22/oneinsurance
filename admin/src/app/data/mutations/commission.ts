import { useAuthStore } from '@/store/auth-store'
import {
  CommissionConfigUpdateRequest,
  CommissionConfigUpdateResponse,
} from '@/types/commission'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

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
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/commission-configurations/${commissionConfigId}`
      const token = `Bearer ${accessToken}`
      const response = await axios.put<CommissionConfigUpdateResponse>(url, data, {
        headers: {
          Authorization: token,
        },
      })

      return response.data
    },
  })
}
