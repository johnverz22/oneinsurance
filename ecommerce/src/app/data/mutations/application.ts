import { api } from '@/lib/axios'
import { ApplyFormValues } from '@/app/(client)/agent-application/form.schema'
import { useMutation } from '@tanstack/react-query'


export const useCreateAgentApplication = () => {
  return useMutation({
    mutationFn: async (value: ApplyFormValues) => {
      const requestBody = {
        first_name: value.firstName,
        last_name: value.lastName,
        email: value.email,
        application_type: value.application_type,
        contact_number: value.contact_number,
        notes: value.notes,
      }
      const response = await api.post('/agents/apply', requestBody)

      return response.data
    },
  })
}
