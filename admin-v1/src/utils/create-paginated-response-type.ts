import { z } from 'zod'

export function createPaginatedResponseType<T>(itemType: z.ZodType<T>) {
  return z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      current_page: z.number(),
      data: z.array(itemType),
      first_page_url: z.string(),
      from: z.number().nullable(),
      last_page: z.number(),
      last_page_url: z.string(),
      links: z.array(
        z.object({
          url: z.string().nullable(),
          label: z.string(),
          active: z.boolean(),
        })
      ),
      next_page_url: z.string().nullable(),
      path: z.string(),
      per_page: z.number(),
      prev_page_url: z.string().nullable(),
      to: z.number().nullable(),
      total: z.number(),
    }),
  })
}

export function createResponseType<T>(itemType: z.ZodType<T>) {
  return z.object({
    success: z.boolean(),
    message: z.string(),
    data: itemType,
  })
}
