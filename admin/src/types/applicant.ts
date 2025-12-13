import { createPaginatedResponseType } from "@/utils/create-paginated-response-type";
import {z} from "zod";

/*
{
                "id": 1,
                "name": "John Doe",
                "email": "john.doe@example.com",
                "contact_number": "+63 912 345 6789",
                "application_type": "agent",
                "status": "pending",
                "notes": "Experienced insurance agent with 5 years in the industry",
                "created_at": "2025-12-10T11:55:44.000000Z",
                "updated_at": "2025-12-10T11:55:44.000000Z",
                "deleted_at": null
            }
*/

export const ApplicantSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    contact_number: z.string(),
    application_type: z.string(),
    status: z.string(),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable(),
})
export type Applicant = z.infer<typeof ApplicantSchema>;

export const ApplicantPaginatedResponseSchema = createPaginatedResponseType<Applicant>(ApplicantSchema);
export type ApplicantPaginatedResponse = z.infer<typeof ApplicantPaginatedResponseSchema>;