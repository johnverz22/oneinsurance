import { z } from 'zod'
import { createAPIResponseSchema } from '../base-api-response'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const documentDraftSchema = z.object({
  fileName: z.string(),
  tag: z.string(),
  file: z.instanceof(File).optional(),
})

export const documentFinalSchema = documentDraftSchema.superRefine(
  (data, ctx) => {
    if (!data.file) {
      ctx.addIssue({
        path: ['file'],
        message: 'Please upload a file',
        code: z.ZodIssueCode.custom,
      })
    } else {
      if (data.file.size > MAX_FILE_SIZE) {
        ctx.addIssue({
          path: ['file'],
          message: 'File size must be less than 10MB',
          code: z.ZodIssueCode.custom,
        })
      }

      if (!ALLOWED_FILE_TYPES.includes(data.file.type)) {
        ctx.addIssue({
          path: ['file'],
          message: 'Only JPG, PNG, WEBP, and PDF files are allowed',
          code: z.ZodIssueCode.custom,
        })
      }
    }
  }
)

export const DocumentSchema = z.object({
  id: z.number(),
  file_id: z.string(),
  file_name: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  size: z.number(),
  folder_id: z.number().nullable(),
  web_view_link: z.string().url(),
  web_content_link: z.string().url(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export const ListDocumentsDataSchema = z.object({
  files: z.array(DocumentSchema),
})
export const ListDocumentsResponseSchema = createAPIResponseSchema(
  ListDocumentsDataSchema
)

export type Document = z.infer<typeof DocumentSchema>
export type ListDocumentsResponse = z.infer<typeof ListDocumentsResponseSchema>
export type DocumentDraftFormSchema = z.infer<typeof documentDraftSchema>
export type DocumentFinalFormSchema = z.infer<typeof documentFinalSchema>
