import { z } from 'zod'

export const RegisterAgentSchema = z
  .object({
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'The password field confirmation does not match.',
    path: ['confirmPassword'],
  })
export type RegisterAgent = z.infer<typeof RegisterAgentSchema>

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

export const ResetPasswordSchema = z
  .object({
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
