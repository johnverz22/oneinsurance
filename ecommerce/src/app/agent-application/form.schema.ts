import { z } from 'zod'

export const BACKGROUND_OPTIONS = [
  { value: 'insurance-sales', label: 'Insurance sales or advisory' },
  { value: 'insurance-agency', label: 'Insurance agency or brokerage' },
  { value: 'business-development', label: 'Sales or business development' },
  { value: 'referral-marketing', label: 'Referral or affiliate marketing' },
  { value: 'new', label: 'New to insurance' },
  { value: 'other', label: 'Other (specify)' },
] as const

export const applyFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address'),
  contact_number: z
    .string()
    .trim()
    .min(1, 'Contact number is required')
    .regex(
      /^([0-9]\d{10}|\+63\s?\d{3}\s?\d{3}\s?\d{4}|\+?[0-9]{10,13})$/,
      'Invalid phone number (e.g. 09171234567 or +63 917 123 4567)'
    ),
  role: z.enum(['agent', 'referral'], {
    message: 'Please select how you would like to partner with us',
  }),
  background: z.string(),
  other_details: z.string().max(2000, 'Please keep details within 2000 characters'),
})

export type ApplyFormValues = z.infer<typeof applyFormSchema>
