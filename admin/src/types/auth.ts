import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type Login = z.infer<typeof LoginSchema>

export const LoginResponseSchema = z.object({
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
export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const LoginValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.record(z.array(z.string())),
})
export type LoginValidationError = z.infer<typeof LoginValidationErrorSchema>

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
