import { z } from 'zod'

export const ProviderSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  contact_email: z.string(),
  contact_phone: z.string(),
  address: z.string(),
  website: z.string().url(),
  logo: z.string().url().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
})
export type Provider = z.infer<typeof ProviderSchema>
