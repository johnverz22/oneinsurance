import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'

export interface AgentBankDetail {
  id: number
  account_name: string
  account_number: string
  bank_name: string
  branch: string
  swift_code: string
  is_primary: boolean
  account_type: string
  account_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AgentEWallet {
  id: number
  account_name: string
  account_number: string
  provider: string
  email: string
  phone: string
  is_primary: boolean
  account_type: string
  account_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AgentAccountsData {
  bank_details: AgentBankDetail[]
  e_wallets: AgentEWallet[]
}

export interface AgentAccountsResponse {
  success: boolean
  message: string
  data: AgentAccountsData
  errors?: string[]
}

export function useGetAgentAccounts(agentId: number | null) {
  const { accessToken } = useAuthStore()

  return useQuery({
    queryKey: ['admin-agent-accounts', agentId],
    queryFn: async () => {
      if (!agentId) throw new Error('Agent ID is required')
      
      const url = `/api/admin/agents/${agentId}/accounts`
      const token = `Bearer ${accessToken}`

      const response = await axios.get<AgentAccountsResponse>(url, {
        headers: {
          Authorization: token,
        },
      })

      const result = response.data
      const hasAccounts = result.data.bank_details.length > 0 || result.data.e_wallets.length > 0

      return { ...result, hasAccounts }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!accessToken && !!agentId,
  })
}