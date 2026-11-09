import { useAuthStore } from '@/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/utils/handle-api-error'

export function useGetPolicyDetails(policyId: string | null) {
  const { getAuthToken } = useAuthStore()

  return useQuery({
    queryKey: ['policy-details', policyId],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `/api/admin/policies/${policyId}`,
          {
            headers: {
              Authorization: getAuthToken(),
            },
          }
        )

        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!getAuthToken() && !!policyId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  })
}