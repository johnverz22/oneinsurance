import { z } from 'zod'

export const signupSchema = z.object({
  // account credential
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),

  // personal information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string({ required_error: 'Last Name is required' })
    .min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.coerce.date({
    required_error: 'Please select your date',
  }),
  gender: z.enum(['male', 'female', 'prefer not to say'], {
    required_error: 'Please select a gender',
  }),

  // contact details
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  country: z.string().min(2, 'Country is required'),
  state: z.string().min(2, 'State/Province is required'),
  city: z.string().min(2, 'City is required'),
  zipCode: z.string().min(3, 'Zip code is required'),
  address: z.string().min(10, 'Please enter a complete address'),

  // employment
  occupation: z.string().min(2, 'Occupation is required'),
  annualIncome: z
    .number({ required_error: 'Annual income is required' })
    .min(0, 'Annual Income cannot be lesser than zero'),

  // terms and policies
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  agreeToPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the privacy policy',
  }),
})

export type SignUpType = z.infer<typeof signupSchema>
