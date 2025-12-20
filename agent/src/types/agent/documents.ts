import { z } from 'zod'

const ID_TYPES = [
  'passport',
  'drivers_license',
  'national_id',
  'residence_permit',
] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const documentDraftSchema = z.object({
  fullName: z.string(),
  documentNumber: z.string(),
  idType: z.enum(ID_TYPES).optional(),
  expiryDate: z.coerce.date(),
  file: z.instanceof(File).optional(),
})

export const documentFinalSchema = documentDraftSchema.superRefine(
  (data, ctx) => {
    if (!data.fullName || data.fullName.length < 2) {
      ctx.addIssue({
        path: ['fullName'],
        message: 'Full name must be at least 2 characters',
        code: z.ZodIssueCode.custom,
      })
    }

    if (!data.documentNumber || data.documentNumber.length < 5) {
      ctx.addIssue({
        path: ['documentNumber'],
        message: 'Document number must be at least 5 characters',
        code: z.ZodIssueCode.custom,
      })
    }

    if (!data.idType) {
      ctx.addIssue({
        path: ['idType'],
        message: 'Please select an ID type',
        code: z.ZodIssueCode.custom,
      })
    }

    if (!data.expiryDate) {
      ctx.addIssue({
        path: ['expiryDate'],
        message: 'Expiry date is required',
        code: z.ZodIssueCode.custom,
      })
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (data.expiryDate <= today) {
        ctx.addIssue({
          path: ['expiryDate'],
          message: 'Document must not be expired',
          code: z.ZodIssueCode.custom,
        })
      }
    }

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

export type DocumentDraftFormSchema = z.infer<typeof documentDraftSchema>
export type DocumentFinalFormSchema = z.infer<typeof documentFinalSchema>
