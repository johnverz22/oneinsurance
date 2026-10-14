import axios from 'axios'
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

      try {
        const response = await axios.post('/api/agents/apply', requestBody, {
          // Give the BFF enough time to hear back from the backend (65 s) plus
          // a small buffer, so we always get the BFF's normalised response
          // rather than a raw browser network timeout.
          timeout: 70_000,
        })
        return response.data
      } catch (err: any) {
        const data = err?.response?.data
        const message =
          data?.message ||
          data?.error ||
          err?.message ||
          'Something went wrong. Please try again.'
        throw new Error(message)
      }
    },
  })
}
