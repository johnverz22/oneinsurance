import { Document, ListDocumentsResponseSchema } from '@/types/agent/documents'
import { useQuery } from '@tanstack/react-query'
import { useAgentAuthStore } from '@/store/agent-auth-store'

export const useGetAllDocuments = () => {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      // Use fetch instead of axios to bypass interceptor issues
      const { accessToken } = useAgentAuthStore.getState()
      
      const response = await fetch('/api/agent/documents?folder_id=&limit=50&page=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch documents:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log('Documents API response:', data)

      const parsed = ListDocumentsResponseSchema.safeParse(data)

      if (!parsed.success || !parsed.data.success) {
        console.error('Documents parsing failed:', parsed.success ? 'API returned success: false' : parsed.error)
        return []
      }

      return parsed.data.data.files
    },
    initialData: [],
  })
}
