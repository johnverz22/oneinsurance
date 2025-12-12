import { z } from 'zod'
import { formatValidators, PhilippineIdType } from '@/types/id-types'

export const RegisterAgentBaseSchema = z.object({
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

  // bank details
  bankName: z.string().min(1, 'Please enter your bank name'),
  bankCode: z.string().min(1, 'Please enter your bank code'),
  routingNumber: z.string().min(1, 'Please enter your bank routing number'),
  accountHolderName: z.string().min(1, 'Please enter your account holder name'),
  accountNumber: z
    .string()
    .min(1, 'Please enter your account number')
    .regex(/^\d+$/, 'Account number must be numeric'),
  accountType: z.enum(['savings', 'current']),

  // verification Documents
  idType: PhilippineIdType,
  idNumber: z.string().min(1, 'Please enter your ID number'),
  licenseNumber: z.string().min(1, 'Please enter your license number'),
  certificateNumber: z.string().min(1, 'Please enter your certificate number'),

  confirmInfo: z.boolean().refine((val) => val === true, {
    message: 'You must confirm your information',
  }),
  authorizeCompany: z.boolean().refine((val) => val === true, {
    message: 'You must authorize the company',
  }),
})

export const RegistrationSchema = RegisterAgentBaseSchema.superRefine(
  (data, ctx) => {
    const validator = formatValidators[data.idType]
    if (validator) {
      const result = validator.safeParse(data.idNumber)
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.errors[0].message,
          path: ['idNumber'],
        })
      }
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'The password field confirmation does not match.',
        path: ['confirmPassword'],
      })
    }
  }
)
export type OnboardingV2 = z.infer<typeof RegistrationSchema>

export const RegisterAgentSchema = RegisterAgentBaseSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  password: true,
  confirmPassword: true,
  phone: true,
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'The password field confirmation does not match.',
      path: ['confirmPassword'],
    })
  }
})
export type RegisterAgent = z.infer<typeof RegisterAgentSchema>

// Extract only bank-related fields
export const bankDetailsSchema = RegisterAgentBaseSchema.pick({
  bankName: true,
  bankCode: true,
  routingNumber: true,
  accountHolderName: true,
  accountNumber: true,
  accountType: true,
})
export type BankDetails = z.infer<typeof bankDetailsSchema>

// Extract only verification document fields
export const verificationDocumentsSchema = RegisterAgentBaseSchema.pick({
  idType: true,
  idNumber: true,
  licenseNumber: true,
  certificateNumber: true,
  confirmInfo: true,
  authorizeCompany: true,
}).superRefine((data, ctx) => {
  const validator = formatValidators[data.idType]
  if (validator) {
    const result = validator.safeParse(data.idNumber)
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error.errors[0].message,
        path: ['idNumber'],
      })
    }
  }
})
export type VerificationDocuments = z.infer<typeof verificationDocumentsSchema>

export const SuccesRegisterAgentSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    role: z.number().or(z.string()),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    designation: z.string(),
    updated_at: z.string(),
    created_at: z.string(),
    id: z.number().or(z.string()),
  }),
})
export type SuccesRegisterAgent = z.infer<typeof SuccesRegisterAgentSchema>

export const RegisterAgentValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.array(z.string())),
})
export type RegisterAgentValidationError = z.infer<
  typeof RegisterAgentValidationErrorSchema
>

export const LoginAgentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginAgent = z.infer<typeof LoginAgentSchema>

export const LoginAgentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    access_token: z.string(),
    token_type: z.string(),
    user: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
      designation: z.string(),
      status: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  }),
})
export type LoginAgentResponse = z.infer<typeof LoginAgentResponseSchema>

export const LoginAgentValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.array(z.string())),
})
export type LoginAgentValidationError = z.infer<
  typeof LoginAgentValidationErrorSchema
>

export type SendEmailVerificationRequest = {
  email: string
  name: string
}

export const ForgotPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})
export type ForgotPasswordResponse = z.infer<
  typeof ForgotPasswordResponseSchema
>

export const ResetPasswordSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    token: z.string().min(1, 'Reset token is required'),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'The password field confirmation does not match.',
    path: ['confirmPassword'],
  })
export type ResetPassword = z.infer<typeof ResetPasswordSchema>

export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>

export const ResetPasswordValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.array(z.string())),
})
export type ResetPasswordValidationError = z.infer<
  typeof ResetPasswordValidationErrorSchema
>
