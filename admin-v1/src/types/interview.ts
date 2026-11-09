import {
  createPaginatedResponseType,
  createResponseType,
} from '@/utils/create-paginated-response-type'
import { z } from 'zod'
import { AgentSchema } from '@/types/agents'

export type CreateInterviewRequest = {
  agent_id: number
  admin_id: number
  scheduled_at: string
  status: 'pending' | 'completed' | 'canceled'
  notes: string
}

export type ScheduleInterviewForm = {
  interviewDate: Date
  interviewTime: string
  notes?: string
}

export function mapScheduleInterviewToCreateRequest(
  formData: ScheduleInterviewForm,
  agentId: number,
  adminId: number
): CreateInterviewRequest {
  // Combine date and time into "YYYY-MM-DD HH:mm:ss" format
  const date = new Date(formData.interviewDate)
  const [hours, minutes] = formData.interviewTime.split(':')

  date.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  // Format as "YYYY-MM-DD HH:mm:ss"
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = '00'

  const scheduledAt = `${year}-${month}-${day} ${hour}:${minute}:${second}`

  return {
    agent_id: agentId,
    admin_id: adminId,
    scheduled_at: scheduledAt,
    status: 'pending',
    notes: formData.notes || '',
  }
}
export const CreateInterviewResponseDataSchema = z.object({
  agent_id: z.number(),
  admin_id: z.number(),
  scheduled_at: z.string(),
  status: z.enum(['pending', 'completed', 'canceled']),
  notes: z.string(),
  updated_at: z.string(),
  created_at: z.string(),
  id: z.number(),
})

export type CreateInterviewResponseData = z.infer<
  typeof CreateInterviewResponseDataSchema
>
export const CreateInterviewResponseSchema =
  createResponseType<CreateInterviewResponseData>(
    CreateInterviewResponseDataSchema
  )
export type CreateInterviewResponse = z.infer<
  typeof CreateInterviewResponseSchema
>

export const InterviewSchema = z.object({
  id: z.number(),
  agent_id: z.number(),
  admin_id: z.number(),
  scheduled_at: z.string(),
  status: z.enum(['pending', 'completed', 'canceled']),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  agent: AgentSchema,
  admin: AgentSchema,
})

export type Interview = z.infer<typeof InterviewSchema>
export const InterviewPaginatedResponseSchema =
  createPaginatedResponseType<Interview>(InterviewSchema)
export type InterviewPaginatedResponse = z.infer<
  typeof InterviewPaginatedResponseSchema
>
