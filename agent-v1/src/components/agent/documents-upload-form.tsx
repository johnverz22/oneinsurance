'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FieldInfo } from '@/components/ui/form'
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react'
import {
  DocumentDraftFormSchema,
  documentDraftSchema,
  documentFinalSchema,
} from '@/types/agent/documents'
import { useUploadDocument } from '@/app/data/mutations/agent/documents'

type DocumentUploadFormProps = {
  onSuccess: () => void
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const { mutateAsync: uploadDocument } = useUploadDocument()

  const form = useForm({
    defaultValues: {
      fileName: '',
      tag: '',
      file: undefined,
    } as DocumentDraftFormSchema,
    validators: {
      onChange: documentDraftSchema,
      onSubmit: documentFinalSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await uploadDocument({ ...value, file: selectedFile! })
        toast.success('Document uploaded successfully.')

        form.reset()
        setSelectedFile(null)
        onSuccess()
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error?.message : 'Something went wrong'
        toast.error(message)
      }
    },
  })

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file)
    form.setFieldValue('file', file as File)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileChange(file)
    }
  }

  return (
    <div className="space-y-3 p-8">
      <div className="space-y-0.5">
        <h3 className="text-2xl font-bold">Upload Document</h3>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <form.Field name="fileName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="fileName" className="text-sm font-medium">
                File Name (Optional)
              </Label>
              <Input
                id="fileName"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Enter custom name"
                className={
                  field.state.meta.errors.length > 0 ? 'border-destructive' : ''
                }
              />

              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="tag">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="tag" className="text-sm font-medium">
                Tag
              </Label>
              <Input
                id="tag"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Enter tag/label for the file"
                className={
                  field.state.meta.errors.length > 0 ? 'border-destructive' : ''
                }
              />

              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="file">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium">
                Upload File <span className="text-destructive">*</span>
              </Label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : field.state.meta.errors.length > 0
                      ? 'border-destructive'
                      : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileChange(file)
                      field.handleChange(file)
                    }
                  }}
                  onBlur={field.handleBlur}
                  className="sr-only"
                />

                {!selectedFile ? (
                  <label
                    htmlFor="file"
                    className="flex cursor-pointer flex-col items-center justify-center"
                  >
                    <Upload className="text-muted-foreground mb-3 h-12 w-12" />
                    <p className="text-foreground mb-1 text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-muted-foreground text-xs">
                      JPG, PNG, WEBP, or PDF (max 10MB)
                    </p>
                  </label>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="text-primary h-10 w-10" />
                      <div>
                        <p className="text-foreground text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        handleFileChange(null)
                        field.handleChange(undefined as unknown as File)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="from-primary to-lilac w-full rounded-full bg-gradient-to-r text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
