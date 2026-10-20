import { z } from 'zod'

export const applyFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  contact_number: z
    .string()
    .min(1, 'Contact number is required')
    .regex(
      /^([0-9]\d{10}|\+63\s?\d{3}\s?\d{3}\s?\d{4}|\+?[0-9]{10,13})$/,
      'Invalid phone number (e.g. 09171234567 or +63 917 123 4567)'
    ),
  application_type: z.enum(['agent', 'referral'], {
    errorMap: () => ({ message: 'Please select an application role' }),
  }),
  notes: z.string(),
})

export type ApplyFormValues = z.infer<typeof applyFormSchema>
