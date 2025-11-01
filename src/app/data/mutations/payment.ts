import {
  PaymentAuthResponse,
  PaymentSubmitRequest,
  PaymentSubmitResponse,
} from '@/types/payment'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function usePaymentAuth() {
  return useMutation({
    mutationKey: ['payment-auth'],
    mutationFn: async () => {
      const response = await axios.post<PaymentAuthResponse>('/api/payment')
      return response.data
    },
  })
}

export function usePaymentSubmit() {
  return useMutation({
    mutationKey: ['payment-submit'],
    mutationFn: async ({
      data,
      brand_token,
      access_token,
    }: {
      data: PaymentSubmitRequest
      brand_token: string
      access_token: string
    }) => {
      const token = `Bearer ${brand_token}`
      const response = await axios.post<PaymentSubmitResponse>(
        '/api/payment/submit',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
        }
      )
      return response.data
    },
  })
}
