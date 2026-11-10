'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

/**
 * Portal sign in form matching mockup:
 * https://developers.oneinsurance.shop/mockups/auth/login
 */
export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null)
    try {
      const res = await fetch('/api/agent/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message ?? 'Sign in failed')
      }

      // Store auth payload temporarily to finalize after OTP verification
      sessionStorage.setItem('pending_auth', JSON.stringify(data))
      sessionStorage.setItem('otp-email', values.email)

      // Request OTP code delivery to the user's email
      try {
        const otpRes = await fetch('/api/agent/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email }),
        })
        const otpData = await otpRes.json().catch(() => null)
        if (!otpRes.ok) {
          console.warn('send-otp warning:', otpData)
        }
      } catch (otpErr) {
        console.warn('send-otp error:', otpErr)
      }

      toast.success('OTP has been sent to your email')
      router.push(`/otp?email=${encodeURIComponent(values.email)}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      setErrorMessage(msg)
      toast.error(msg)
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#006838] dark:text-[#d0e3c8]">
        Agent Portal
      </p>

      <div>
        <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-.055em]">
          Sign in
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--text-sub)]">
          Use your assigned portal account to continue.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-9 space-y-5"
          aria-label="Portal sign in"
        >
          <div>
            <label htmlFor="portal-email" className="block text-sm font-semibold">
              Email address
            </label>
            <input
              id="portal-email"
              type="email"
              autoComplete="username"
              required
              placeholder="name@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'portal-email-error' : undefined}
              className="ui-form-field mt-2 min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2.5 text-base placeholder:text-[var(--text-muted)] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[var(--text-muted)]"
              {...register('email')}
            />
            {errors.email && (
              <p id="portal-email-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="portal-password" className="text-sm font-semibold">
                Password
              </label>
              <Link
                href="/reset-password"
                className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1">
              <input
                id="portal-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'portal-password-error' : undefined}
                className="ui-form-field min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white py-2.5 pl-3 pr-17 text-base placeholder:text-[var(--text-muted)] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[var(--text-muted)]"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-1 min-w-14 rounded-md px-2 text-sm font-semibold text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p id="portal-password-error" role="alert" className="mt-1.5 text-xs text-[#dc2626]">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-[#006838] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]"
              {...register('remember')}
            />
            <span>Remember me</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Continuing…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
