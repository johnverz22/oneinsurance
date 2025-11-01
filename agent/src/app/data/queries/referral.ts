import { useAgentAuthStore } from '@/store/agent-auth-store'
import { ReferralResponse } from '@/types/agent/referral'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function getReferralCode() {
  const { accessToken, user } = useAgentAuthStore()
  return useQuery({
    queryKey: ['referralCode'],
    queryFn: async () => {
      try {
        const url = `/api/agent/referral?id=${user?.id}`
        const response = await axios.get<ReferralResponse>(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        })

        return response.data.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          switch (error.response?.status) {
            case 401:
              alert('Session expired. Please log in again.')
              removeLocalStorage('agent-auth-storage')
              window.location.href = '/login'
              return
          }
        }

        throw error
      }
    },
    retry: false,
    enabled: !!accessToken && !!user,
  })
}
