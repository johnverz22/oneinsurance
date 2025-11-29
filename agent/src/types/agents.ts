import { z } from 'zod'

export const AgentSchema = z.object({
  id: z.number(),
  company_id: z.number().nullable(),
  role: z.number(),
  username: z.string().nullable(),
  first_name: z.string(),
  middle_name: z.string().nullable(),
  last_name: z.string(),
  designation: z.string().nullable(),
  job_description: z.string().nullable(),
  avatar: z.string().nullable(),
  email: z.string().email(),
  email_verified_at: z.string().nullable(),
  status: z.string(),
  phone: z.string().nullable(),
  phone_verified_at: z.string().nullable(),
  phone_description: z.string().nullable(),
  telephone: z.string().nullable(),
  address: z.string().nullable(),
  is_super_admin: z.number(),
  birth_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Agent = z.infer<typeof AgentSchema>
