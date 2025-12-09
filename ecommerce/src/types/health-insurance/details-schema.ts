import z from 'zod'

export const HealthDetailsFormSchema = z.object({
  fullName: z.string().min(1, { message: 'Please enter your full name.' }),
  email: z.string().email(),
  mobileNumber: z.string().regex(/^9\d{9}$/, {
    message: 'Mobile number must start with 9 and be 10 digits long.',
  }),
  countryOfResidency: z
    .string()
    .min(1, { message: 'Please select country of residency.' }),
  travelFrequency: z
    .string()
    .min(1, { message: 'Please select of travel frequency.' }),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
})

export type HealthDetailsFormType = z.infer<typeof HealthDetailsFormSchema>
