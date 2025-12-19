import {z} from 'zod'
import { AgentSchema } from './agents'
import { createPaginatedResponseType } from '@/utils/create-paginated-response-type'

export const InvitationSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    token: z.string(),
    invitation_url: z.string().url(),
    role: z.string(),
    expires_at: z.string(),
    invited_by: z.number(),
    accepted_at: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    inviter: AgentSchema
})
export type Invitation = z.infer<typeof InvitationSchema>

export const InvitationPaginatedResponseSchema = createPaginatedResponseType<Invitation>(InvitationSchema)
export type InvitationPaginatedResponse = z.infer<typeof InvitationPaginatedResponseSchema>