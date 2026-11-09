'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[a-z])/, 'Must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
      .regex(/(?=.*\d)/, 'Must contain at least one number')
      .regex(/(?=.*[@$!%*?&])/, 'Must contain at least one symbol (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'The password field confirmation does not match.',
    path: ['confirmPassword'],
  })

type ForgotValues = z.infer<typeof forgotSchema>
type ResetValues = z.infer<typeof resetSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email') || ''

  // Mode 1: Request reset link (no token)
  const [forgotSubmitted, setForgotSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  // Mode 2: Reset password (has token)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: emailParam },
  })

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  // Submit email to request reset link
  const onForgotSubmit = async (values: ForgotValues) => {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined

      const res = await fetch('/api/agent/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, redirectUrl }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message ?? 'Request failed')
      }
      setSubmittedEmail(values.email)
      setForgotSubmitted(true)
      toast.success(data?.message || 'Reset link requested.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed')
    }
  }

  // Submit new password with token
  const onResetSubmit = async (values: ResetValues) => {
    try {
      const res = await fetch('/api/agent/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: emailParam,
          password: values.password,
          password_confirmation: values.confirmPassword,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message ?? 'Password reset failed')
      }
      setResetSuccess(true)
      toast.success(data?.message || 'Password reset successfully.')
      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password reset failed')
    }
  }

  // If token is present in URL, show Set New Password view
  if (token) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#006838] dark:text-[#d0e3c8]">
          Agent Portal
        </p>

        <div>
          <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-.055em]">
            Set new password
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5b6e61] dark:text-[#c4c7c5]">
            Create a strong, new password for {emailParam ? <strong className="text-[#183d2c] dark:text-[#f4f5f2]">{emailParam}</strong> : 'your agent account'}.
          </p>

          {!resetSuccess ? (
            <form
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              noValidate
              className="mt-9 space-y-5"
              aria-label="Set new password"
            >
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold">
                  New password
                </label>
                <div className="relative mt-2">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Enter new password"
                    aria-invalid={!!resetForm.formState.errors.password}
                    aria-describedby={
                      resetForm.formState.errors.password ? 'new-password-error' : undefined
                    }
                    className="ui-form-field min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2.5 pr-16 text-base placeholder:text-[#808080] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[#b2b7b4]"
                    {...resetForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-[#006838] hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {resetForm.formState.errors.password && (
                  <p id="new-password-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                    {resetForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold">
                  Confirm new password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter new password"
                    aria-invalid={!!resetForm.formState.errors.confirmPassword}
                    aria-describedby={
                      resetForm.formState.errors.confirmPassword ? 'confirm-password-error' : undefined
                    }
                    className="ui-form-field min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2.5 pr-16 text-base placeholder:text-[#808080] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[#b2b7b4]"
                    {...resetForm.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-semibold text-[#006838] hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p id="confirm-password-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-60"
              >
                {resetForm.formState.isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {resetForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          ) : (
            <div
              role="status"
              className="mt-9 rounded-md border border-[#c7d4c9] bg-white p-5 dark:border-[#565c58] dark:bg-[#303530]"
            >
              <h2 className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                Password updated successfully
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5b6e61] dark:text-[#c4c7c5]">
                Your password has been reset. Redirecting you to sign in…
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block text-sm font-semibold text-[#006838] underline underline-offset-4 dark:text-[#d0e3c8]"
              >
                Sign in now
              </Link>
            </div>
          )}

          <Link
            href="/login"
            className="mt-7 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  // Standard Mode: Request reset link
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#006838] dark:text-[#d0e3c8]">
        Agent Portal
      </p>

      <div>
        <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-.055em]">
          Reset password
        </h1>
        <p className="mt-4 text-base leading-7 text-[#5b6e61] dark:text-[#c4c7c5]">
          Enter your account email to request a password reset link.
        </p>

        {!forgotSubmitted ? (
          <form
            onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
            noValidate
            className="mt-9 space-y-5"
            aria-label="Request a password reset link"
          >
            <div>
              <label htmlFor="reset-email" className="block text-sm font-semibold">
                Email address
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="username"
                required
                placeholder="name@company.com"
                aria-invalid={!!forgotForm.formState.errors.email}
                aria-describedby={
                  forgotForm.formState.errors.email ? 'reset-email-error' : undefined
                }
                className="ui-form-field mt-2 min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2.5 text-base placeholder:text-[#808080] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[#b2b7b4]"
                {...forgotForm.register('email')}
              />
              {forgotForm.formState.errors.email && (
                <p id="reset-email-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                  {forgotForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={forgotForm.formState.isSubmitting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-60"
            >
              {forgotForm.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {forgotForm.formState.isSubmitting ? 'Requesting…' : 'Request reset link'}
            </button>
          </form>
        ) : (
          <div
            role="status"
            className="mt-9 rounded-md border border-[#c7d4c9] bg-white p-5 dark:border-[#565c58] dark:bg-[#303530]"
          >
            <h2 className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Reset link sent</h2>
            <p className="mt-2 text-sm leading-6 text-[#5b6e61] dark:text-[#c4c7c5]">
              If an account exists for{' '}
              <strong className="text-[#183d2c] dark:text-[#f4f5f2]">{submittedEmail}</strong>, you
              will receive a password reset link shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setForgotSubmitted(false)
                forgotForm.reset()
              }}
              className="mt-3 min-h-11 rounded-md text-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
            >
              Try another email
            </button>
          </div>
        )}

        <Link
          href="/login"
          className="mt-7 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
