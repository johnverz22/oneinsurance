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

type MutationArgs = BankType | EWalletType

export function useAddAccountDetails() {
  const { accessToken } = useAgentAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['add-bank-details'],
    mutationFn: async ({ values }: MutationArgs) => {
      const token = `Bearer ${accessToken}`
      const response = await axios.post('/api/acounts/add', values, {
        headers: {
          Authorization: token,
        },
      })
      return response.data
    },
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-accounts'] })
    },
  })
}

export function useEditAccountDetails() {
  const { accessToken } = useAgentAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['edit-bank-details'],
    mutationFn: async ({ values }: MutationArgs) => {
      const token = `Bearer ${accessToken}`
      const response = await axios.post('/api/accounts/edit', values, {
        headers: {
          Authorization: token,
        },
      })
      return response.data
    },
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-accounts'] })
    },
  })
}
