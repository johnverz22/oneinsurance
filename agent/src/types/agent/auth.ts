/** Profile photo object returned by the API */
export type ProfilePhoto = {
  id: number
  mime_type: string
  updated_at: string
  /** Proxy URL with cache-busting query string, e.g. /api/agent/profile/photo?v=42 */
  url: string
}

/** Agent user shape returned by the API */
export type AgentUser = {
  id: number
  name: string
  email: string
  role: string
  designation: string
  /** Agent's professional background / bio, or null when unset */
  background?: string | null
  /** True when the agent's email is confirmed and the account is active */
  is_verified?: boolean
  phone: string
  status: string
  /** Structured profile photo, or null when the agent has no photo */
  profile_photo: ProfilePhoto | null
  agent_code?: string | null
  created_at: string
  updated_at: string
}

/** Login API response shape */
export type LoginAgentResponse = {
  success: true
  message: string
  data: {
    access_token: string
    token_type: string
    user: AgentUser
  }
}

/** OTP verification request */
export type OtpVerifyRequest = {
  email: string
  otp: string
}

/** Forgot-password request */
export type ForgotPasswordRequest = {
  email: string
}

/** Reset-password request */
export type ResetPasswordRequest = {
  token: string
  email: string
  password: string
  password_confirmation: string
}

// ---------------------------------------------------------------------------
// Signup (invitation token flow)
// ---------------------------------------------------------------------------

import { z } from 'zod'

export const RegisterAgentSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^([0-9]\d{10}|\+63\s\d{3}\s\d{3}\s\d{4})$/, 'Invalid phone number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/(?=.*[a-z])/, 'Must contain an uppercase and lowercase letter.')
      .regex(/(?=.*[A-Z])/, 'Must contain an uppercase and lowercase letter.')
      .regex(/(?=.*\d)/, 'Must contain at least one number.')
      .regex(/(?=.*[@$!%*?&])/, 'Must contain at least one symbol.'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z
      .string()
      .min(10, 'Invalid invitation token')
      .max(200, 'Invalid invitation token format'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      })
    }
  })

export type RegisterAgent = z.infer<typeof RegisterAgentSchema>

export type RegisterAgentResponse = {
  success: boolean
  message: string
  data: {
    id: number | string
    first_name: string
    last_name: string
    email: string
    phone: string
    designation: string
    role: number | string
    created_at: string
    updated_at: string
  }
}

export type AgentSignUpAutoFill = {
  first_name: string
  last_name: string
  email: string
  contact_number: string
  application_type: string
}

export type AgentSignUpAutoFillResponse = {
  success: boolean
  message: string
  data: AgentSignUpAutoFill
}
