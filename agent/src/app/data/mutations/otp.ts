import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

export function useSendOTP() {
  return useMutation({
    mutationKey: ['send-otp'],
    mutationFn: async (email: string) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login/otp/send`
      const response = await axios.post(url, { email })
      return response.data
    },
  })
}

export function useResendOTP() {
  return useMutation({
    mutationKey: ['resend-otp'],
    mutationFn: async (email: string) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login/otp/resend`
      const response = await axios.post(url, { email })
      return response.data
    },
  })
}

export function useVerifyOTP() {
  return useMutation({
    mutationKey: ['verify-otp'],
    mutationFn: async (data: { email: string; otp: string }) => {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login/otp/verify`
      const response = await axios.post(url, data)
      return response.data
    },
  })
}