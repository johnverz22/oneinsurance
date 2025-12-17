import { useAuthStore } from '@/store/auth-store'
import {
  UpdateApplicantStatusRequest,
  UpdateApplicantStatusResponse,
} from '@/types/applicant'
import { handleApiError } from '@/utils/handle-api-error'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useUpdateApplicantStatus() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['update-applicant-status'],
    mutationFn: async ({ data, applicantId }: { data: UpdateApplicantStatusRequest, applicantId: number }) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/applicants/${applicantId}`
        const token = `Bearer ${accessToken}`
        const response = await axios.put<UpdateApplicantStatusResponse>(
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
