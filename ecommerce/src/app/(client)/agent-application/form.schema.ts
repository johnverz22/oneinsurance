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
  // notes: z.string(),
})

export type ApplyFormValues = z.infer<typeof applyFormSchema>


export const AgentSignUpFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'The password field must be at least 8 characters.')
    .regex(
      /(?=.*[a-z])/,
      'The password field must contain at least one uppercase and one lowercase letter.'
    )
    .regex(
      /(?=.*[A-Z])/,
      'The password field must contain at least one uppercase and one lowercase letter.'
    )
    .regex(/(?=.*\d)/, 'The password field must contain at least one number.')
    .regex(
      /(?=.*[@$!%*?&])/,
      'The password field must contain at least one symbol.'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: z.string().regex(/^[0-9]\d{10}$/, 'Invalid phone number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type AgentSignUpFormValues = z.infer<typeof AgentSignUpFormSchema>