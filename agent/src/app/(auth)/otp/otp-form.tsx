'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import type { LoginAgentResponse } from '@/types/agent/auth'

/**
 * Login verification form matching mockup:
 * https://developers.oneinsurance.shop/mockups/auth/otp
 */
export function OtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAgentAuthStore((s) => s.login)
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const fromParam = searchParams.get('email')
    const fromStorage =
      typeof window !== 'undefined' ? sessionStorage.getItem('otp-email') ?? '' : ''
    const targetEmail = fromParam || fromStorage
    setEmail(targetEmail)
    if (!targetEmail) {
      toast.error('Email is missing. Please sign in again.')
      router.push('/login')
    }
  }, [searchParams, router])

  const submitOtp = async (otpCode: string) => {
    if (otpCode.length !== 6 || isSubmitting) return
    if (!email) {
      toast.error('Email is missing. Please sign in again.')
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    setNotice('')
    try {
      const res = await fetch('/api/agent/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message ?? 'Verification failed')
      }

      // Check for pending auth payload stored during login
      const pendingAuthStr = sessionStorage.getItem('pending_auth')
      if (pendingAuthStr) {
        try {
          const pendingAuth = JSON.parse(pendingAuthStr) as LoginAgentResponse
          login(pendingAuth)
        } catch {
          if (data?.data?.access_token) {
            login(data as LoginAgentResponse)
          }
        }
      } else if (data?.data?.access_token) {
        login(data as LoginAgentResponse)
      }

      sessionStorage.removeItem('pending_auth')
      sessionStorage.removeItem('otp-email')
      toast.success('Signed in successfully!')
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setNotice(msg)
      toast.error(msg)
      setCode('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    submitOtp(code)
  }

  const handleResend = async () => {
    if (isResending) return
    if (!email) {
      toast.error('Email is missing. Please sign in again.')
      router.push('/login')
      return
    }

    setIsResending(true)
    setNotice('')
    try {
      const res = await fetch('/api/agent/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message ?? 'Could not resend the code')
      }
      setNotice('A new verification code has been sent to your email.')
      toast.success(data?.message ?? 'A new code has been sent to your email.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not resend the code'
      setNotice(msg)
      toast.error(msg)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#006838] dark:text-[#d0e3c8]">
        Agent Portal
      </p>

      <div>
        <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-.055em]">
          Verify your login
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--text-sub)]">
          {email ? (
            <>
              Enter the six-digit code sent to{' '}
              <span className="font-semibold text-[var(--text-main)]">{email}</span> to continue.
            </>
          ) : (
            'Enter the six-digit code sent to your account email to continue.'
          )}
        </p>

        <form onSubmit={handleVerify} className="mt-9 space-y-5" aria-label="Login verification">
          <div>
            <label htmlFor="login-otp" className="block text-sm font-semibold">
              Verification code
            </label>
            <input
              id="login-otp"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              autoComplete="one-time-code"
              required
              placeholder="000000"
              aria-describedby="login-otp-help"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                setCode(val)
                setNotice('')
                if (val.length === 6) {
                  submitOtp(val)
                }
              }}
              className="ui-form-field mt-2 min-h-14 w-full rounded-md border border-[#c7d4c9] bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[.45em] placeholder:text-[var(--text-muted)] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#303530] dark:placeholder:text-[var(--text-muted)]"
            />
            <p id="login-otp-help" className="mt-2 text-sm leading-6 text-[var(--text-sub)]">
              Enter the 6-digit verification code sent to your registered email.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-sm font-semibold text-white hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Verifying…' : 'Verify and sign in'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex min-h-11 items-center rounded-md font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] disabled:opacity-50"
          >
            {isResending ? 'Sending code…' : 'Resend code'}
          </button>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
          >
            ← Back to sign in
          </Link>
        </div>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-md border border-[#c7d4c9] bg-white p-4 text-sm leading-6 text-[var(--text-main)] dark:border-[#565c58] dark:bg-[#303530]"
          >
            {notice}
          </p>
        )}
      </div>
    </div>
  )
}
