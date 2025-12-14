import { useMutation } from '@tanstack/react-query'
import {
  CreateInterviewResponse,
  CreateInterviewRequest,
} from '@/types/interview'
import { useAuthStore } from '@/store/auth-store'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useCreateInterview() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['create-interview'],
    mutationFn: async (interviewData: CreateInterviewRequest) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/interviews`
        const token = `Bearer ${accessToken}`
        const response = await axios.post<CreateInterviewResponse>(
          url,
          interviewData,
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
