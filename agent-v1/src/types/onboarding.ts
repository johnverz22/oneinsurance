import { z } from 'zod'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const onboardingSchema = z.object({
  // company details
  registeredUnder: z
    .string()
    .min(1, 'Please select where your company is registered'),
  companyName: z.string().min(1, 'Please enter the company name'),
  businessAddress: z.string().min(1, 'Please enter your business address'),
  contactNumber: z
    .string()
    .regex(/(^(\+63|0)?[9]\d{9}$)/, 'Please enter a valid contact number'),
  industry: z.string().min(1, 'Please the industry your company in.'),
  yearsInOperation: z
    .number()
    .min(1, 'Please enter the years in operation of your company'),

  // authorized contact person details
  lastName: z.string().min(1, 'Please enter your last name'),
  firstName: z.string().min(1, 'Please enter your first name'),
  middleName: z.string(),
  designation: z
    .string()
    .min(1, 'Please enter your Designation / Position in the Company'),
  dateOfBirth: z.date().refine(
    (date) => {
      const today = new Date()
      const eighteenYearsAgo = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      )
      return date <= eighteenYearsAgo
    },
    {
      message: 'You must be at least 18 years old',
    }
  ),
  nickname: z.string().min(1, 'Please enter your nickname'),
  mobileNumber: z
    .string()
    .regex(/(^(\+63|0)?[9]\d{9}$)/, 'Please enter a valid mobile number'),
  telephoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /(^(\+63|0)?[9]\d{9}$)/.test(val),
      'Please enter a valid contact number'
    )
    .or(z.literal('')),
  email: z.string().email('Please enter a valid email'),

  // Line of business interest
  lineOfBusiness: z
    .array(z.object({}))
    .min(1, 'Please select at least line of business'),

  // commission payment reference
  paymentMethod: z.string().min(1, 'Please select a bank'),
  otherPaymentMethod: z.string().optional(),
  accountName: z.string().min(1, 'Please the Account Name'),
  accountNumber: z
    .string()
    .regex(
      /^[A-Za-z0-9]{8,20}$/,
      'Account number must be 8-20 alphanumeric characters with no special symbols'
    ),
  branch: z.string().min(1, 'Please enter a Branch'),
  signatureImage: z
    .instanceof(File, { message: 'Please upload your signature' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_MIME_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
  printedName: z.string().min(1, 'Please enter your printed name'),

  // two valid goverment id
  firstGovId: z
    .instanceof(File, { message: 'Please upload your valid Goverment ID' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_MIME_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
  secondGovId: z
    .instanceof(File, { message: 'Please upload your valid Goverment ID' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_MIME_TYPES.includes(file.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
})

export type AgentOnboarding = z.infer<typeof onboardingSchema>

export const companyDetailsSchema = onboardingSchema.pick({
  registeredUnder: true,
  companyName: true,
  businessAddress: true,
  contactNumber: true,
  industry: true,
  yearsInOperation: true,
})

export const contactPersonSchema = onboardingSchema.pick({
  lastName: true,
  firstName: true,
  middleName: true,
  designation: true,
  dateOfBirth: true,
  nickname: true,
  mobileNumber: true,
  telephoneNumber: true,
  email: true,
})

export const lineOFBusinesSchema = onboardingSchema.pick({
  lineOfBusiness: true,
})

export const commissionPaymentReferenceSchema = onboardingSchema
  .pick({
    paymentMethod: true,
    otherPaymentMethod: true,
    accountName: true,
    accountNumber: true,
    branch: true,
  })
  .refine(
    (data) => {
      if (
        data.paymentMethod === 'others' &&
        (!data.otherPaymentMethod || data.otherPaymentMethod.trim() === '')
      ) {
        return false
      }

      return true
    },
    {
      message: 'Please specify your bank',
      path: ['otherPaymentMethod'],
    }
  )

export const validGovIdSchema = onboardingSchema.pick({
  firstGovId: true,
  secondGovId: true,
})

export const signatureSchema = onboardingSchema.pick({
  signatureImage: true,
  printedName: true,
})

export type Onboarding = z.infer<typeof onboardingSchema>
export type ComapnyDetails = z.infer<typeof companyDetailsSchema>
export type ContactPerson = z.infer<typeof contactPersonSchema>
export type LineOfBusiness = z.infer<typeof lineOFBusinesSchema>
export type CommissionPayementReference = z.infer<
  typeof commissionPaymentReferenceSchema
>
export type ValidGovId = z.infer<typeof validGovIdSchema>
export type SignatureForm = z.infer<typeof signatureSchema>
