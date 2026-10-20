import { z } from 'zod'

export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
  })

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  })

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.array(z.string())),
})

export const createAPIResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
) =>
  z.discriminatedUnion('success', [
    successResponseSchema(dataSchema),
    errorResponseSchema,
  ])

export const getFirstErrorMessage = (
  errors: Record<string, string[]>
): string | null => {
  const firstKey = Object.keys(errors)[0]
  if (!firstKey) return null
  return errors[firstKey]?.[0] ?? null
}
