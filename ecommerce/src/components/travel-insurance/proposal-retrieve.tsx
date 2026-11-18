'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  FileSearch,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react'
import {
  requestResumeOtp,
  verifyResumeOtp,
} from '@/utils/proposal-loader'

export type RetrieveNotice =
  | { kind: 'error' | 'expired' | 'issued' | 'unavailable'; message: string }
  | null

const GENERIC_SENT_COPY =
  'If this quotation can still be resumed, we have emailed a 6-digit code to the main traveller. It can take a few minutes. If nothing arrives, the quotation may have expired or already be completed. You can start a new quotation.'

export function RetrieveNoticeAlert({
  notice,
  onNewQuote,
  onRetry,
}: {
  notice: RetrieveNotice
  onNewQuote: () => void
  onRetry?: () => void
}) {
  if (!notice) return null

  return (
    <div
      role="alert"
      className={[
        'mt-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        notice.kind === 'unavailable'
          ? 'border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/10'
          : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10',
      ].join(' ')}
    >
      <AlertCircle
        className={[
          'mt-0.5 size-4 shrink-0',
          notice.kind === 'unavailable'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400',
        ].join(' ')}
        aria-hidden
      />
      <div
        className={
          notice.kind === 'unavailable'
            ? 'text-amber-800 dark:text-amber-300'
            : 'text-red-800 dark:text-red-300'
        }
      >
        <p>{notice.message}</p>
        {notice.kind === 'expired' && (
          <button
            type="button"
            onClick={onNewQuote}
            className="mt-2 font-semibold underline underline-offset-4"
          >
            Start a new quote
          </button>
        )}
        {notice.kind === 'unavailable' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * The proposal-number form (no heading — callers own the surrounding header).
 */
export function ProposalRetrieveForm({
  initialValue = '',
  notice,
  loading,
  onSearch,
  onNewQuote,
  onRetry,
}: {
  initialValue?: string
  notice: RetrieveNotice
  loading: boolean
  onSearch: (proposalNo: string) => void
  onNewQuote: () => void
  /** Called when the user retries after an `unavailable` notice. */
  onRetry?: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const [touched, setTouched] = useState(false)
  const empty = touched && !value.trim()

  return (
    <>
      <RetrieveNoticeAlert notice={notice} onNewQuote={onNewQuote} onRetry={onRetry} />

      <form
        noValidate
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          setTouched(true)
          if (value.trim()) onSearch(value.trim())
        }}
      >
        <label htmlFor="proposal-search" className="block text-sm font-medium">
          Proposal or policy reference <span aria-hidden className="text-red-600">*</span>
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="proposal-search"
            value={value}
            required
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
            autoComplete="off"
            autoCapitalize="characters"
            aria-invalid={empty || undefined}
            aria-describedby={empty ? 'proposal-search-error' : undefined}
            placeholder="e.g. MIC-TMPHPC2-261019-000001"
            className="ui-form-field min-h-11 w-full sm:flex-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
        {empty && (
          <p id="proposal-search-error" role="alert" className="mt-1 text-xs text-red-700 dark:text-red-300">
            Please enter a proposal number
          </p>
        )}
      </form>

      <p className="mt-6 text-sm text-[var(--text-muted)]">
        No proposal yet?{' '}
        <button
          type="button"
          onClick={onNewQuote}
          className="font-semibold text-[var(--primary)] underline underline-offset-4 dark:text-[#d0e3c8]"
        >
          Start a new quote
        </button>
      </p>
    </>
  )
}

/**
 * Email-code verification panel. Used when the resume request cannot find a
 * token (another device, or the token expired). The screen must not promise an
 * email — OI deliberately never reveals whether the proposal exists.
 */
export function ResumeOtpPanel({
  proposalNo,
  onVerified,
  onCancel,
  onNewQuote,
}: {
  proposalNo: string
  onVerified: () => void
  onCancel?: () => void
  onNewQuote: () => void
}) {
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [locked, setLocked] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(0)
  const [fieldError, setFieldError] = useState('')
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const sentRef = useRef(false)

  useEffect(() => {
    if (!cooldownUntil) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= cooldownUntil) {
        setCooldownUntil(0)
        window.clearInterval(id)
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  const remaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - (now || Date.now())) / 1000))
    : 0

  const sendCode = async () => {
    if (locked || sending || remaining > 0) return
    setSending(true)
    setFieldError('')
    setMessage(null)
    const result = await requestResumeOtp(proposalNo)
    setSending(false)

    if (result.status === 'sent') {
      setCooldownUntil(Date.now() + 60_000)
      setNow(Date.now())
      setMessage({ tone: 'info', text: GENERIC_SENT_COPY })
      return
    }

    if (result.status === 'rate_limited') {
      setCooldownUntil(Date.now() + result.retryAfterSeconds * 1000)
      setNow(Date.now())
      setMessage({
        tone: 'error',
        text: `Please wait ${result.retryAfterSeconds} seconds before asking again.`,
      })
      return
    }

    setMessage({ tone: 'error', text: result.message })
  }

  // Auto-send code immediately on mount when entering this screen
  useEffect(() => {
    if (sentRef.current) return
    sentRef.current = true
    void sendCode()
  }, [])

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verifying || locked) return
    const clean = code.trim()
    if (!/^\d{6}$/.test(clean)) {
      setFieldError('Enter the 6-digit code from the email.')
      return
    }
    setFieldError('')
    setMessage(null)
    setVerifying(true)
    const result = await verifyResumeOtp(proposalNo, clean)
    setVerifying(false)

    if (result.status === 'verified') {
      onVerified()
      return
    }
    if (result.status === 'invalid_format') {
      setFieldError(result.message)
      return
    }
    if (result.status === 'locked') {
      setLocked(true)
      setMessage({ tone: 'error', text: result.message })
      return
    }
    setMessage({ tone: 'error', text: result.message })
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="mt-2 text-base leading-6 text-[var(--text-sub)]">
          Enter the 6-digit code sent to the email on file for{' '}
          <span className="font-semibold text-[var(--text-main)] break-all">{proposalNo}</span>.
        </p>
        {sending && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-muted)] dark:text-[var(--text-sub)]">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Sending…
          </span>
        )}
      </div>

      {message && (
        <div
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={[
            'mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
            message.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-300'
              : 'border-[#dfe7df] bg-[#f1f2f0] text-[var(--text-sub)] dark:border-[#3d4140] dark:bg-[#303232] dark:text-[var(--text-sub)]',
          ].join(' ')}
        >
          {message.tone === 'error' && (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <form noValidate onSubmit={verify} className="mt-5">
        <label htmlFor="resume-otp" className="block text-sm font-medium">
          6-digit verification code
        </label>
        <input
          id="resume-otp"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setFieldError('')
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          disabled={verifying || locked}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? 'resume-otp-error' : undefined}
          placeholder="482915"
          className="ui-form-field mt-2 min-h-11 w-full tracking-[0.4em] text-center text-lg font-semibold"
        />
        {fieldError && (
          <p id="resume-otp-error" role="alert" className="mt-1 text-xs text-red-700 dark:text-red-300">
            {fieldError}
          </p>
        )}

        <button
          type="submit"
          disabled={verifying || locked || code.length !== 6}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-3 text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-50 dark:focus-visible:outline-white"
        >
          {verifying ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Verifying…
            </>
          ) : (
            'Verify code'
          )}
        </button>

        {!locked && (
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={sending || remaining > 0}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[#006838] underline underline-offset-4 disabled:text-[var(--text-muted)] disabled:no-underline dark:text-[#d0e3c8]"
          >
            {remaining > 0 ? `Send a new code in ${remaining}s` : 'Send a new code'}
          </button>
        )}
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe7df] pt-4 text-sm dark:border-[#3d4140]">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--text-sub)] hover:text-[var(--text-main)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Use a different proposal
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onNewQuote}
          className="font-semibold text-[var(--primary)] underline underline-offset-4 dark:text-[#d0e3c8]"
        >
          Start a new quote
        </button>
      </div>
    </>
  )
}

/**
 * Full page panel used by the review route. Shows the proposal form, or the
 * email-code panel when `verificationFor` is set.
 */
export function ProposalRetrieve({
  initialValue = '',
  notice,
  loading,
  verificationFor,
  onSearch,
  onVerified,
  onCancelVerification,
  onNewQuote,
  onRetry,
}: {
  initialValue?: string
  notice: RetrieveNotice
  loading: boolean
  /** Proposal that must be verified with an emailed code before resuming. */
  verificationFor?: string | null
  onSearch: (proposalNo: string) => void
  onVerified?: () => void
  onCancelVerification?: () => void
  onNewQuote: () => void
  /** Called when the user retries after an `unavailable` notice. */
  onRetry?: () => void
}) {
  return (
    <section className="travel-applicant-card mx-auto mt-8 max-w-2xl" aria-labelledby="retrieve-title">
      <div className="flex items-start gap-3">
        {verificationFor ? (
          <Mail className="mt-1 size-6 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
        ) : (
          <FileSearch className="mt-1 size-6 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
        )}
        <div>
          <h1 id="retrieve-title" className="text-2xl font-semibold tracking-tight">
            {verificationFor ? 'Verify with an email code' : 'Retrieve your proposal'}
          </h1>
          {!verificationFor && (
            <p className="mt-2 text-base leading-6 text-[var(--text-sub)]">
              Enter your proposal number to review your saved quote and continue to payment. You can also scan the QR
              code on your proposal.
            </p>
          )}
        </div>
      </div>

      {verificationFor ? (
        <ResumeOtpPanel
          proposalNo={verificationFor}
          onVerified={() => onVerified?.()}
          onCancel={onCancelVerification}
          onNewQuote={onNewQuote}
        />
      ) : (
        <ProposalRetrieveForm
          initialValue={initialValue}
          notice={notice}
          loading={loading}
          onSearch={onSearch}
          onNewQuote={onNewQuote}
          onRetry={onRetry}
        />
      )}
    </section>
  )
}
