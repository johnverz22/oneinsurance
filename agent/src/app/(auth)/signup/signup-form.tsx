'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { RegisterAgentSchema, type RegisterAgent, type AgentSignUpAutoFillResponse } from '@/types/agent/auth'
import { useIsAuthenticated } from '@/store/agent-auth-store'

export default function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAuthenticated = useIsAuthenticated()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingAutofill, setIsLoadingAutofill] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const token = searchParams.get('token') ?? ''

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAgent>({
    resolver: zodResolver(RegisterAgentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      token,
    },
  })

  // Redirect authenticated users away
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  // Keep hidden token field in sync if searchParams change
  useEffect(() => {
    setValue('token', token)
  }, [token, setValue])

  // Fetch autofill data from the invitation token
  useEffect(() => {
    if (!token || token.length < 10) return

    setIsLoadingAutofill(true)
    fetch('/api/agent/auth/signup-autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data: AgentSignUpAutoFillResponse = await res.json().catch(() => null)
        if (res.ok && data?.data) {
          setValue('firstName', data.data.first_name ?? '')
          setValue('lastName', data.data.last_name ?? '')
          setValue('email', data.data.email ?? '')
          setValue('phone', data.data.contact_number ?? '')
        } else if (!res.ok) {
          toast.error(data?.message ?? 'Could not load invitation details. Please fill in your information manually.')
        }
      })
      .catch(() => {
        toast.error('Could not load invitation details. Please fill in your information manually.')
      })
      .finally(() => setIsLoadingAutofill(false))
  }, [token, setValue])

  const onSubmit = async (values: RegisterAgent) => {
    setServerError(null)
    setFieldErrors({})

    try {
      const res = await fetch('/api/agent/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        // 422 validation errors from backend
        if (res.status === 422 && data?.errors) {
          setFieldErrors(data.errors)
          setServerError(data.message ?? 'Please fix the errors below.')
        } else {
          setServerError(data?.message ?? 'Registration failed. Please try again.')
        }
        return
      }

      setSuccessMessage('Account created successfully! Redirecting to login…')
      setTimeout(() => router.push('/login'), 1500)
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
    }
  }

  const INPUT_BASE =
    'min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2.5 text-base placeholder:text-[#808080] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[#b2b7b4]'
  const INPUT_ERROR = 'border-red-400 focus:border-red-500 focus:outline-red-500'
  const LABEL_BASE = 'block text-sm font-semibold'
  const ERROR_TEXT = 'mt-1.5 text-xs text-[#dc2626]'

  // Gather any backend field error for a given field name
  const backendError = (field: string) => fieldErrors[field]?.[0]

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#006838] dark:text-[#d0e3c8]">
        Agent Portal
      </p>

      <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-.05em]">
        Create your account
      </h1>
      <p className="mt-3 text-base leading-7 text-[#5b6e61] dark:text-[#c4c7c5]">
        Complete your registration using the invitation link sent to your email.
      </p>

      {/* Token missing warning */}
      {!token && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
        >
          No invitation token found. Please use the signup link provided in your invitation email.
        </div>
      )}

      {/* Autofill loading indicator */}
      {isLoadingAutofill && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#5b6e61] dark:text-[#c4c7c5]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Loading your invitation details…</span>
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {serverError}
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div
          role="status"
          className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300"
        >
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Agent registration"
        className="mt-8 space-y-5"
      >
        {/* Hidden token */}
        <input type="hidden" {...register('token')} />

        {/* Name row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="signup-firstName" className={LABEL_BASE}>
              First Name <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="signup-firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Juan"
              aria-invalid={!!(errors.firstName || backendError('first_name'))}
              className={`${INPUT_BASE} mt-2 ${errors.firstName || backendError('first_name') ? INPUT_ERROR : ''}`}
              {...register('firstName')}
            />
            {(errors.firstName || backendError('first_name')) && (
              <p role="alert" className={ERROR_TEXT}>
                {errors.firstName?.message ?? backendError('first_name')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-lastName" className={LABEL_BASE}>
              Last Name <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="signup-lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Dela Cruz"
              aria-invalid={!!(errors.lastName || backendError('last_name'))}
              className={`${INPUT_BASE} mt-2 ${errors.lastName || backendError('last_name') ? INPUT_ERROR : ''}`}
              {...register('lastName')}
            />
            {(errors.lastName || backendError('last_name')) && (
              <p role="alert" className={ERROR_TEXT}>
                {errors.lastName?.message ?? backendError('last_name')}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className={LABEL_BASE}>
            Email address <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="username"
            placeholder="juan@example.com"
            aria-invalid={!!(errors.email || backendError('email'))}
            className={`${INPUT_BASE} mt-2 ${errors.email || backendError('email') ? INPUT_ERROR : ''}`}
            {...register('email')}
          />
          {(errors.email || backendError('email')) && (
            <p role="alert" className={ERROR_TEXT}>
              {errors.email?.message ?? backendError('email')}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="signup-phone" className={LABEL_BASE}>
            Phone number <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            placeholder="09171234567"
            aria-invalid={!!(errors.phone || backendError('phone'))}
            className={`${INPUT_BASE} mt-2 ${errors.phone || backendError('phone') ? INPUT_ERROR : ''}`}
            {...register('phone')}
          />
          {(errors.phone || backendError('phone')) && (
            <p role="alert" className={ERROR_TEXT}>
              {errors.phone?.message ?? backendError('phone')}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="signup-password" className={LABEL_BASE}>
            Password <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              aria-invalid={!!(errors.password || backendError('password'))}
              className={`${INPUT_BASE} pr-17 ${errors.password || backendError('password') ? INPUT_ERROR : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-1 min-w-14 rounded-md px-2 text-sm font-semibold text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {(errors.password || backendError('password')) && (
            <p role="alert" className={ERROR_TEXT}>
              {errors.password?.message ?? backendError('password')}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="signup-confirmPassword" className={LABEL_BASE}>
            Confirm Password <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <div className="relative mt-2">
            <input
              id="signup-confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirmPassword}
              className={`${INPUT_BASE} pr-17 ${errors.confirmPassword ? INPUT_ERROR : ''}`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-1 min-w-14 rounded-md px-2 text-sm font-semibold text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p role="alert" className={ERROR_TEXT}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !token || !!successMessage}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#5b6e61] dark:text-[#c4c7c5]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-[#006838] underline-offset-4 hover:underline dark:text-[#d0e3c8]"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
