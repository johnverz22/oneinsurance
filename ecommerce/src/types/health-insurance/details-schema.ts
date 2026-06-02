import z from 'zod'

export const HealthDetailsFormSchema = z.object({
  firstName: z.string().min(1, { message: 'Please enter your first name.' }),
  lastName: z.string().min(1, { message: 'Please enter your last name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  mobile: z.string().regex(/^9\d{9}$/, {
    message: 'Mobile number must start with 9 and be 10 digits long.',
  }),
  dateOfBirth: z.string().min(1, { message: 'Please enter your date of birth.' }),
  genderCode: z.enum(['M', 'F'], { message: 'Please select your gender.' }),
  isSmoker: z.enum(['Y', 'N'], { message: 'Please select smoking status.' }),
  effectiveDate: z.string().min(1, { message: 'Please select coverage start date.' }),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions.',
  }),
})

export type HealthDetailsFormType = z.infer<typeof HealthDetailsFormSchema>
