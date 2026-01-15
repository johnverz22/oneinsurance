import { useAuthStore } from '@/store/auth-store'
import {
  LineOfBusinessFormData,
  LineOfBusinessResponse,
} from '@/types/line-of-business'
import { handleApiError } from '@/utils/handle-api-error'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useCreateLineOfBusiness() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['create-line-of-business'],
    mutationFn: async (data: LineOfBusinessFormData) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/lobs`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.post<LineOfBusinessResponse>(url, data, {
          headers: {
            Authorization: token,
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export function useUpdateLineOfBusiness() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['update-line-of-business'],
    mutationFn: async ({
      lobId,
      data,
    }: {
      lobId: number
      data: LineOfBusinessFormData
    }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/lobs/${lobId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.put<LineOfBusinessResponse>(url, data, {
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

export function useDeleteLineOfBusiness() {
  const { accessToken } = useAuthStore()

  return useMutation({
    mutationKey: ['delete-line-of-business'],
    mutationFn: async (lobId: number) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/lobs/${lobId}`
      const token = `Bearer ${accessToken}`
      try {
        const response = await axios.delete<void>(url, {
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
