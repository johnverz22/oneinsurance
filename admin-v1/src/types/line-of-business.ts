import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'
import { z } from 'zod'
import { createResponseSchema } from './base-api-response'
import { AgentSchema } from './agents'

/*
{
                "id": 1,
                "name": "Travel Insurance",
                "description": "Insurance coverage for travel-related risks including trip cancellation, medical emergencies, and lost luggage",
                "status": "active",
                "created_at": "2026-01-15T12:53:46.000000Z",
                "updated_at": "2026-01-15T12:53:46.000000Z",
                "deleted_at": null
            }
*/

export const LineOfBusinessFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['active', 'inactive']),
})

export type LineOfBusinessFormData = z.infer<typeof LineOfBusinessFormSchema>

export const LineOfBusinessSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
})

export type LineOfBusiness = z.infer<typeof LineOfBusinessSchema>
export const LineOfBusinessPaginatedResponseSchema =
  createPaginatedResponseType<LineOfBusiness>(LineOfBusinessSchema)
export const LineOfBusinessResponse = createResponseSchema(LineOfBusinessSchema)
export type LineOfBusinessResponse = z.infer<typeof LineOfBusinessResponse>
export type LineOfBusinessPaginatedResponse = z.infer<
  typeof LineOfBusinessPaginatedResponseSchema
>

export const LineOfBusinessAgentsSchema = z.object({
  line_of_business: LineOfBusinessSchema,
  agents: z.array(
    z.object({
      id: z.number(),
      agent: AgentSchema,
      status: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    })
  ),
  total_agents: z.number(),
})
export type LineOfBusinessAgents = z.infer<typeof LineOfBusinessAgentsSchema>
export const LineOfBusinessAgentsResponseSchema = createResponseSchema(
  LineOfBusinessAgentsSchema
)
export type LineOfBusinessAgentsResponse = z.infer<
  typeof LineOfBusinessAgentsResponseSchema
>
