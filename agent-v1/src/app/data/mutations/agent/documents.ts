import { api } from '@/lib/axios'
import { Document, DocumentFinalFormSchema } from '@/types/agent/documents'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: DocumentFinalFormSchema) => {
      const formData = new FormData()

      formData.append('file', values.file!)
      formData.append('file_name', values.fileName)
      formData.append('tag', values.tag)

      const response = await api.post('/agents/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

const getFilenameFromDisposition = (disposition?: string) => {
  if (!disposition) return null

  const match = disposition.match(/filename="?(.+?)"?$/)
  return match?.[1] ?? 'download'
}

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (values: Pick<Document, 'id' | 'file_name'>) => {
      const response = await api.get<Blob>(
        `/agents/files/${values.id}/download`,
        {
          responseType: 'blob',
        }
      )

      const blob = response.data
      const disposition = response.headers['content-disposition']
      const filename =
        getFilenameFromDisposition(disposition) ?? values.file_name

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: Pick<Document, 'id'>) => {
      const response = await api.delete(`/agents/files/${values.id}`)
      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
