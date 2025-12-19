/*
{
                "id": 14,
                "email": "johndoe3@gmail.com",
                "token": "nUPZo55wojpg3QMMxaT4bljaZzjlKPvfU2iZIRexNBrU847HpmvRx9DRdhnmUwHt",
                "invitation_url": "https://affiliate.intel-soln.com.ph/signup?token=nUPZo55wojpg3QMMxaT4bljaZzjlKPvfU2iZIRexNBrU847HpmvRx9DRdhnmUwHt",
                "role": "agent",
                "expires_at": "2025-12-26T13:01:30.000000Z",
                "invited_by": 17,
                "accepted_at": null,
                "created_at": "2025-12-19T13:01:30.000000Z",
                "updated_at": "2025-12-19T13:01:30.000000Z",
                "inviter": {
                    "id": 17,
                    "company_id": null,
                    "role": 0,
                    "username": null,
                    "first_name": "Super",
                    "middle_name": null,
                    "last_name": "Admin",
                    "designation": "Administrator",
                    "job_description": null,
                    "avatar": null,
                    "email": "admin@ifrc.com",
                    "email_verified_at": "2025-10-08T11:18:09.000000Z",
                    "status": "active",
                    "phone": null,
                    "phone_verified_at": null,
                    "phone_description": null,
                    "telephone": null,
                    "address": null,
                    "is_super_admin": 0,
                    "birth_date": null,
                    "created_at": null,
                    "updated_at": null
                }
            }
*/

import {z} from 'zod'
import { AgentSchema } from './agents'
import { createPaginatedResponseType } from '@/utils/create-response-type'

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

