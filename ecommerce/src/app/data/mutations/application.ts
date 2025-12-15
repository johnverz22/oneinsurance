import { api } from '@/lib/axios'
import { AgentSignUpFormValues, ApplyFormValues } from '@/app/(client)/agent-application/form.schema'
import { useMutation } from '@tanstack/react-query'

type CreateAgentApplicationArgs = {
  values: Omit<ApplyFormValues, 'firstName' | 'lastName'> & { name: string }
}

export const useCreateAgentApplication = () => {
  return useMutation({
    mutationFn: async ({ values}: {values: AgentSignUpFormValues}) => {
      const newValues = {
    "first_name": values.firstName,
    "last_name": values.lastName,
    "email": values.email,
    "password": values.password,
    "password_confirmation": values.confirmPassword,
    "phone": values.phone, 
    "designation": "Agent"
}

      const response = await api.post('/agents/register', newValues)

      return response.data
    },
  })
}
