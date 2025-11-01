import { z } from 'zod'

// Define allowed file types for supporting documents
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// File validation schema
export const FileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(MAX_FILE_SIZE, 'File size must be less than 10MB'),
  type: z
    .string()
    .refine(
      (type) => ALLOWED_FILE_TYPES.includes(type),
      'Invalid file type. Allowed types: images, PDFs, Word documents, Excel files, and text files'
    ),
  lastModified: z.number().optional(),
  // For browser File objects
  arrayBuffer: z.function().optional(),
  text: z.function().optional(),
  stream: z.function().optional(),
  slice: z.function().optional(),
})

// Main insurance claim schema
export const InsuranceClaimSchema = z.object({
  policyNumber: z
    .string()
    .min(1, 'Policy number is required')
    .regex(
      /^[A-Z0-9-]+$/,
      'Policy number must contain only uppercase letters, numbers, and hyphens'
    )
    .max(50, 'Policy number must be less than 50 characters'),

  dateOfIncident: z
    .date()
    .max(new Date(), 'Date of incident cannot be in the future')
    .min(
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 10),
      'Date of incident cannot be more than 10 years ago'
    ),

  estimatedClaimAmount: z
    .number()
    .positive('Estimated claim amount must be positive')
    .max(10000000, 'Estimated claim amount cannot exceed $10,000,000')
    .multipleOf(0.01, 'Amount must be in valid currency format (cents)'),

  descriptionOfIncident: z
    .string()
    .min(10, 'Description must be at least 10 characters long')
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim(),

  locationOfIncident: z
    .string()
    .min(5, 'Location must be at least 5 characters long')
    .max(200, 'Location cannot exceed 200 characters')
    .trim(),

  supportingDocuments: z
    .array(FileSchema)
    .min(1, 'At least one supporting document is required')
    .max(10, 'Maximum 10 supporting documents allowed')
    .refine((files) => {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      return totalSize <= 50 * 1024 * 1024 // 50MB total
    }, 'Total file size cannot exceed 50MB'),
})

export type InsuranceClaim = z.infer<typeof InsuranceClaimSchema>
export type FileData = z.infer<typeof FileSchema>

// Example usage and validation function
export const validateInsuranceClaim = (data: unknown): InsuranceClaim => {
  return InsuranceClaimSchema.parse(data)
}

// Helper function to validate just the files
export const validateSupportingDocuments = (files: File[]): boolean => {
  try {
    const fileObjects = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }))

    InsuranceClaimSchema.shape.supportingDocuments.parse(fileObjects)
    return true
  } catch {
    return false
  }
}

// Example of how to use with form data
export const createInsuranceClaimFromFormData = (
  formData: FormData
): InsuranceClaim => {
  const files = formData.getAll('supportingDocuments') as File[]

  const claimData = {
    policyNumber: formData.get('policyNumber') as string,
    dateOfIncident: new Date(formData.get('dateOfIncident') as string),
    estimatedClaimAmount: parseFloat(
      formData.get('estimatedClaimAmount') as string
    ),
    descriptionOfIncident: formData.get('descriptionOfIncident') as string,
    locationOfIncident: formData.get('locationOfIncident') as string,
    supportingDocuments: files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })),
  }

  return validateInsuranceClaim(claimData)
}
