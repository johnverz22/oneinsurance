import { createPaginatedResponseType } from "@/utils/create-paginated-response-type";
import {z} from "zod";
import { createResponseSchema } from "./base-api-response";

export const ApplicantSchema = z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
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

export const UpdateApplicantStatusRequestSchema = z.object({
    status: z.string(),
    notes: z.string().optional(),
})
export type UpdateApplicantStatusRequest = z.infer<typeof UpdateApplicantStatusRequestSchema>;

export const UpdateApplicantStatusResponseSchema = createResponseSchema(ApplicantSchema);
export type UpdateApplicantStatusResponse = z.infer<typeof UpdateApplicantStatusResponseSchema>;