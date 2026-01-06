'use client'

import { useDownloadDocument } from '@/app/data/mutations/agent/documents'
import { useGetAllDocuments } from '@/app/data/queries/documents'
import { Document } from '@/types/agent/documents'
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../ui/button'

export function DocumentsList() {
  const { data, isLoading, isError } = useGetAllDocuments()
  const { mutateAsync: downloadDocument } = useDownloadDocument()

  const documents = data ?? []

  const handleDownloadDocument = async (doc: Document) => {
    try {
      await downloadDocument({ id: doc.id, file_name: doc.file_name })
      toast.success('Document is ready to be saved!')
    } catch (error: unknown) {
      console.log('Failed to upload document:', error)

      const message =
        error instanceof Error ? error?.message : 'Something went wrong'
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading documents...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center">
        Failed to load documents.
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-lg">
        No documents found.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="hover:bg-muted flex items-center justify-between rounded-lg border p-4 transition"
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <FileText className="text-muted-foreground h-5 w-5" />

            <div>
              <p className="leading-none font-medium">{doc.file_name}</p>

              <p className="text-muted-foreground mt-1 text-sm">
                {doc.mime_type} • {(doc.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {new Date(doc.created_at).toLocaleDateString()}
            </span>

            <a
              href={doc.web_view_link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted rounded-md p-2"
              title="View"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <Button
              className="rounded-md p-2"
              onClick={() => handleDownloadDocument(doc)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
