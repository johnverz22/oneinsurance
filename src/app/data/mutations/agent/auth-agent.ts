import { useMutation } from '@tanstack/react-query'
import {
  RegisterAgent,
  SuccesRegisterAgent,
  SendEmailVerificationRequest,
  LoginAgent,
  LoginAgentResponse,
  ResetPassword,
  ResetPasswordResponse,
  ForgotPasswordResponse,
} from '@/types/agent/auth'
import axios from 'axios'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import { NotVerifiedEmailError } from '@/lib/errors'

export function useRegisterAgent() {
  return useMutation({
    mutationKey: ['register-agent'],
    mutationFn: async ({ data }: { data: RegisterAgent }) => {
      const requestBody = {
        ...data,
        designation: 'Agent',
      }
      const response = await axios.post<SuccesRegisterAgent>(
        '/api/agent/auth/signup',
        requestBody
      )

      return response.data
    },
  })
}

export function useSendEmailVerification() {
  return useMutation({
    mutationKey: ['send-email-verification'],
    mutationFn: async ({ data }: { data: SendEmailVerificationRequest }) => {
      const token = `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`
      const response = await axios.post(
        '/api/agent/auth/send-email-verification',
        data,
        {
          headers: {
            Authorization: token,
          },
        }
      )

      return response.data
    },
  })
}

export function useLoginAgent() {
  return useMutation({
    mutationKey: ['login-agent'],
    mutationFn: async ({ data }: { data: LoginAgent }) => {
      try {
        const response = await axios.post<LoginAgentResponse>(
          '/api/agent/auth/login',
          data
        )

        return response.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          switch (error.response?.status) {
            case 403:
              throw new NotVerifiedEmailError(
                error.response.data.message || 'Email not verified'
              )
          }
        }

        throw error
      }
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationKey: ['forgot-password-agent'],
    mutationFn: async ({
      data,
    }: {
      data: { email: string; redirectUrl: string }
    }) => {
      const response = await axios.post<ForgotPasswordResponse>(
        '/api/agent/auth/forgot-password',
        data
      )
      return response.data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationKey: ['reset-password-agent'],
    mutationFn: async ({ data }: { data: ResetPassword }) => {
      const response = await axios.post<ResetPasswordResponse>(
        '/api/agent/auth/reset-password',
        data
      )

      return response.data
    },
  })
}

export function useLogoutAgent() {
  const token = useAgentAuthStore((state) => state.getAuthToken())
  return useMutation({
    mutationKey: ['logout-agent'],
    mutationFn: async () => {
      try {
        const response = await axios.post(
          '/api/agent/auth/logout',
          {},
          {
            headers: {
              Authorization: token,
            },
          }
        )

        return response.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          switch (error.response?.status) {
            case 401:
              removeLocalStorage('agent-auth-storage')
              window.location.href = '/login'
              return
          }
        }

        throw error
      }
    },
  })
}
