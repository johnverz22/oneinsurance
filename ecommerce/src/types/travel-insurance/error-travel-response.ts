import { createResponseSchema } from '@/types/base-api-response'
import { z } from 'zod'

const ErrorMessageSchema = z.object({
  code: z.string(),
  message: z.string(),
})

const ValidateResultSchema = z.object({
  ErrorMessage: z.array(ErrorMessageSchema),
})

const ValidationErrorSchema = z.object({
  ValidateResult: ValidateResultSchema,
})

export const FullQuoteResponseValidationErrorSchema = createResponseSchema(
  ValidationErrorSchema
)
export type FullQuoteResponseValidationError = z.infer<
  typeof FullQuoteResponseValidationErrorSchema
>
