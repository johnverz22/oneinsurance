import { useAuthStore } from '@/store/auth-store'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { headers } from 'next/headers'

export function useAssignProductsToAgent() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['assign-products-to-agent'],
    mutationFn: async (payload: any) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agent-products`
      const token = `Bearer ${accessToken}`

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: token,
        },
      })

      return response.data
    },
  })
}
