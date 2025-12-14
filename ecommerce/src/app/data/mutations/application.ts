import { api } from '@/lib/axios'
import { ApplyFormValues } from '@/app/(client)/agent-application/form.schema'
import { useMutation } from '@tanstack/react-query'

type CreateAgentApplicationArgs = {
  values: Omit<ApplyFormValues, 'firstName' | 'lastName'> & { name: string }
}

export const useCreateAgentApplication = () => {
  return useMutation({
    mutationFn: async ({ values }: CreateAgentApplicationArgs) => {
      const response = await api.post('/agents/apply', values)

      return response.data
    },
  })
}
