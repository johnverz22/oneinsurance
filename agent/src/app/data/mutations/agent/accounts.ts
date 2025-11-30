import axios from 'axios'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BankDetailsFormValues, EWalletFormValues } from '@/types/account'

type BankType = {
  type: 'bank'
  values: BankDetailsFormValues
}

type EWalletType = {
  type: 'ewallet'
  values: EWalletFormValues
}

export type AccountMutationArgs = BankType | EWalletType

export function useAddAccountDetails() {
  const { accessToken, user } = useAgentAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['add-account-details'],
    mutationFn: async ({ values }: AccountMutationArgs) => {
      const token = `Bearer ${accessToken}`
      const response = await axios.post('/api/accounts/add', values, {
        headers: {
          Authorization: token,
        },
      })
      return response.data
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['agent-accounts', user?.id],
      })
    },
  })
}

export function useEditAccountDetails() {
  const { accessToken, user } = useAgentAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['edit-account-details'],
    mutationFn: async ({ values }: AccountMutationArgs) => {
      const token = `Bearer ${accessToken}`
      const response = await axios.post('/api/accounts/edit', values, {
        headers: {
          Authorization: token,
        },
      })
      return response.data
    },
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['agent-accounts', user?.id],
      })
    },
  })
}
