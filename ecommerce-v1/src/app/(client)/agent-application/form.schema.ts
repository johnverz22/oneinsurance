import { z } from 'zod'

export const applyFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contact_number: z
    .string({ required_error: 'Contact Number is required' })
    .regex(/^([0-9]\d{10}|\+63\s\d{3}\s\d{3}\s\d{4})$/, 'Invalid phone number'),
  application_type: z.enum(['agent', 'referral']),
  notes: z.string(),
})

export type ApplyFormValues = z.infer<typeof applyFormSchema>
