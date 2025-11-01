import { CTPLProductType } from '@/types/ctpl-insurance/ctpl-types'

export type CtplInsuranceProduct = {
  image: string
  title: string
  code: CTPLProductType
}

import { z } from 'zod'

export const ctplDurationSchema = z
  .object({
    duration: z.union([z.literal(1), z.literal(3)], {
      message: 'Duration must be 1 or 3 years',
    }),
    effectiveDate: z.date({ required_error: 'Effective date is required' }),
    expiryDate: z.date({ required_error: 'Expiry date is required' }),
  })
  .refine((data) => data.expiryDate > data.effectiveDate, {
    message: 'Expiry date must be after effective date',
    path: ['expiryDate'],
  })

export type CtplDuration = z.infer<typeof ctplDurationSchema>

// Main vehicle registration form schema
export const VehicleRegistrationSchema = z.object({
  // Basic identification fields
  mvFileNumber: z
    .string()
    .min(1, 'MV File Number is required')
    .regex(
      /^[A-Z0-9-]+$/,
      'MV File Number must contain only letters, numbers, and hyphens'
    )
    .transform((val) => val.toUpperCase()),

  plateNumber: z
    .string()
    .min(1, 'Plate Number is required')
    .regex(
      /^[A-Z0-9-]+$/,
      'Plate Number must contain only letters, numbers, and hyphens'
    )
    .transform((val) => val.toUpperCase()),

  engineNumber: z
    .string()
    .min(1, 'Engine Number is required')
    .regex(
      /^[A-Z0-9-]+$/,
      'Engine Number must contain only alphanumeric characters and hyphens'
    )
    .transform((val) => val.toUpperCase()),

  chassisNumber: z
    .string()
    .min(1, 'Chassis Number is required')
    .min(17, 'Chassis Number must be at least 17 characters')
    .max(17, 'Chassis Number must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format')
    .transform((val) => val.toUpperCase()),

  // Vehicle specifications
  make: z
    .string()
    .min(1, 'Make is required')
    .max(50, 'Make must not exceed 50 characters')
    .transform((val) => val.toUpperCase()),

  model: z
    .string()
    .min(1, 'Model is required')
    .max(50, 'Model must not exceed 50 characters')
    .transform((val) => val.toUpperCase()),

  bodyType: z
    .string()
    .min(1, 'Body Type is required')
    .max(30, 'Body Type must not exceed 30 characters')
    .transform((val) => val.toUpperCase()),

  modelYear: z
    .string()
    .min(1, 'Model year is required')
    .regex(/^\d{4}$/, 'Model year must be a 4-digit year')
    .refine(
      (year) => {
        const yearNum = parseInt(year, 10)
        return yearNum >= 1900 && yearNum <= new Date().getFullYear() + 1
      },
      {
        message: `Model year must be between 1900 and ${new Date().getFullYear() + 1}`,
      }
    ),

  subModel: z
    .string()
    .min(1, 'Sub Model is required')
    .max(100, 'Sub Model must not exceed 100 characters'),

  typeOfUse: z
    .string()
    .min(1, 'Type of Use is required')
    .max(50, 'Type of Use must not exceed 50 characters')
    .transform((val) => val.toUpperCase()),

  dateOfRegistration: z.date({
    required_error: 'Date of Registration is required',
  }),

  fieldOfficeCode: z
    .string()
    .max(10, 'Field Office Code must not exceed 10 characters'),

  // Terms and conditions
  agreeToTerms: z
    .boolean()
    .refine(
      (val) => val === true,
      'You must agree to the Terms & Conditions and Privacy Policy'
    ),
})

export const SuffixEnum = z.enum([
  'JR',
  'SR',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'ETAL.',
  'No Suffix',
])

export const PersonalInfoSchema = z.object({
  // Full Name fields
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(
      /^[A-Za-z\s'-]+$/,
      'First name can only contain letters, spaces, apostrophes, and hyphens'
    ),

  middleName: z
    .string()
    .max(50, 'Middle name must not exceed 50 characters')
    .regex(
      /^[A-Za-z\s'-]*$/,
      'Middle name can only contain letters, spaces, apostrophes, and hyphens'
    )
    .optional(),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(
      /^[A-Za-z\s'-]+$/,
      'Last name can only contain letters, spaces, apostrophes, and hyphens'
    ),

  suffix: SuffixEnum.optional(),

  // Personal details
  gender: z.string().min(1, 'Gender is required'),

  dateOfBirth: z.date().max(new Date(), "Date of birth can't be in the future"),

  idType: z.string().min(1, 'ID Type is required'),

  idNumber: z
    .string()
    .min(1, 'ID Number is required')
    .min(5, 'ID Number must be at least 5 characters')
    .max(30, 'ID Number must not exceed 30 characters')
    .regex(
      /^[A-Z0-9-]+$/,
      'ID Number can only contain letters, numbers, and hyphens'
    )
    .transform((val) => val.toUpperCase()),

  // Address fields
  province: z.string().min(1, 'Province is required'),

  city: z.string().min(1, 'City is required'),

  zipCode: z.string().min(1, 'Postal Code is required'),
  addressLine1: z
    .string()
    .min(1, 'Address Line 1 is required')
    .max(100, 'Address Line 1 must not exceed 100 characters'),

  addressLine2: z
    .string()
    .max(100, 'Address Line 2 must not exceed 100 characters'),

  // Contact information
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^9\d{9}$/, 'Mobile number must be 10 digits starting with 9'),

  email: z
    .string()
    .min(1, 'Email address cannot be empty')
    .email('Please enter a valid email address')
    .max(100, 'Email must not exceed 100 characters')
    .transform((val) => val.toLowerCase()),
})

export const CtplInsuranceSchema = z.union([
  VehicleRegistrationSchema,
  PersonalInfoSchema,
])

// Type inference
export type PersonalInfoFormData = z.infer<typeof PersonalInfoSchema>

// Type inference for TypeScript
export type VehicleRegistrationFormData = z.infer<
  typeof VehicleRegistrationSchema
>
