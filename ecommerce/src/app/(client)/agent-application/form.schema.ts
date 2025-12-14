import { z } from 'zod'

export const applyFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contact_number: z
    .string({ required_error: 'Contact Number is required' })
    .min(10, 'Invalid phone number')
    .max(11, 'Invalid phone number'),
  application_type: z.enum(['agent']),
  notes: z.string(),
})

export type ApplyFormValues = z.infer<typeof applyFormSchema>
