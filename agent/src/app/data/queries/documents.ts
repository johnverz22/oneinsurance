import { api } from '@/lib/axios'
import { Document, ListDocumentsResponseSchema } from '@/types/agent/documents'
import { useQuery } from '@tanstack/react-query'

export const useGetAllDocuments = () => {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get(
        '/agents/files/list?folder_id=&limit=50&page=1'
      )

      const parsed = ListDocumentsResponseSchema.safeParse(response.data)

      if (!parsed.success || !parsed.data.success) {
        return []
      }

      return parsed.data.data.files
    },
    initialData: [],
  })
}
