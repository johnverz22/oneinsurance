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
    mutationFn: async ({
      data,
      applicantId,
    }: {
      data: UpdateApplicantStatusRequest
      applicantId: number
    }) => {
      try {
        const response = await axios.put<UpdateApplicantStatusResponse>(
          `/api/admin/applicants/${applicantId}`,
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

export function useResendSignUpInvite() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['resend-signup-invite'],
    mutationFn: async (applicantId: number) => {
      try {
        const response = await axios.post(
          `/api/admin/invitations/${applicantId}/resend`,
          {},
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
