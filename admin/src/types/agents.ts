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

export const PaginationLinkSchema = z.object({
  url: z.string().nullable(),
  label: z.string(),
  active: z.boolean(),
})

export const AgentsDataSchema = z.object({
  current_page: z.number(),
  data: z.array(AgentSchema),
  first_page_url: z.string(),
  from: z.number().nullable(),
  last_page: z.number(),
  last_page_url: z.string(),
  links: z.array(PaginationLinkSchema),
  next_page_url: z.string().nullable(),
  path: z.string(),
  per_page: z.number(),
  prev_page_url: z.string().nullable(),
  to: z.number().nullable(),
  total: z.number(),
})

export const AgentsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: AgentsDataSchema,
})

export type Agent = z.infer<typeof AgentSchema>
export type AgentsData = z.infer<typeof AgentsDataSchema>
export type AgentsResponse = z.infer<typeof AgentsResponseSchema>

export default Agent
