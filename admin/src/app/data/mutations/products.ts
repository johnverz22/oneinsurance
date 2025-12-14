import { useAuthStore } from '@/store/auth-store'
import { CreateProductRequest, CreateProductResponse } from '@/types/products'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { headers } from 'next/headers'
import { handleApiError } from '@/utils/handle-api-error'

export function useAssignProductsToAgent() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['assign-products-to-agent'],
    mutationFn: async (payload: any) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/agent-products`
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

export function useCreateProduct() {
  const { accessToken } = useAuthStore()
  return useMutation({
    mutationKey: ['create-product'],
    mutationFn: async (payload: CreateProductRequest) => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/products`
        const token = `Bearer ${accessToken}`
        const response = await axios.post<CreateProductResponse>(url, payload, {
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
