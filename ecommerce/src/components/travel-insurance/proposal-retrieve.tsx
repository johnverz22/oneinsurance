'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, FileSearch, Loader2, RefreshCw } from 'lucide-react'

export type RetrieveNotice =
  | { kind: 'error' | 'expired' | 'issued' | 'unavailable'; message: string }
  | null

export function ProposalRetrieve({
  agentCode,
  initialValue = '',
  notice,
  loading,
  onSearch,
  onNewQuote,
  onRetry,
}: {
  agentCode: string
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
    <section className="travel-applicant-card mx-auto mt-8 max-w-2xl" aria-labelledby="retrieve-title">
      <div className="flex items-start gap-3">
        <FileSearch className="mt-1 size-6 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
        <div>
          <h1 id="retrieve-title" className="text-2xl font-semibold tracking-tight">
            Retrieve your proposal
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-sub)]">
            Enter your proposal number to review your saved quote and continue to payment. You can also scan the QR
            code on your proposal.
          </p>
        </div>
      </div>

      {notice && (
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
      )}

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
          Proposal number <span aria-hidden className="text-red-600">*</span>
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
        <Link
          href={`/${agentCode}/travel-insurance`}
          className="font-semibold text-[var(--primary)] underline underline-offset-4 dark:text-[#d0e3c8]"
        >
          Start a new quote
        </Link>
      </p>
    </section>
  )
}
