'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Check, CheckCircle2, Clock, Copy, Download, Headset, Loader2, Mail, Phone, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SUPPORT } from '@/constants/support'

type Stage = 'verifying' | 'issuing'

const STEPS: { key: string; label: string; hint: string }[] = [
  { key: 'payment', label: 'Payment confirmed', hint: 'Verifying your payment with the gateway' },
  { key: 'policy', label: 'Issuing your policy', hint: 'Recording your policy with the insurer' },
  { key: 'documents', label: 'Preparing Certificate of Coverage and Invoice', hint: 'Fetching your documents' },
]

export function PaymentFinalizing({ stage }: { stage: Stage }) {
  const active = stage === 'verifying' ? 0 : 1

  return (
    <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none" role="status" aria-live="polite">
      <CardHeader className="px-5 pt-5 pb-3 sm:px-6">
        <h2 className="text-primary text-lg font-bold sm:text-2xl">Finalizing Your Policy</h2>
        <p className="text-muted-foreground text-sm">
          Please keep this page open. We&apos;re getting your Certificate of Coverage and Invoice ready.
        </p>
      </CardHeader>
      <CardContent className="px-5 pt-3 pb-6 sm:px-6">
        <ol className="divide-border divide-y rounded-lg border">
          {STEPS.map((step, i) => {
            const done = i < active
            const current = i === active
            return (
              <li key={step.key} className={cn('flex items-center gap-3 p-4', current && 'bg-primary/5')}>
                <span className="flex size-8 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="text-success size-6" />
                  ) : current ? (
                    <Loader2 className="text-primary size-6 animate-spin" />
                  ) : (
                    <span className="border-border size-5 rounded-full border-2" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold', done || current ? 'text-foreground' : 'text-muted-foreground')}>
                    {step.label}
                  </p>
                  {current && <p className="text-muted-foreground text-xs">{step.hint}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

interface PaymentIssueErrorProps {
  proposalNumber: string | null
  paymentReference?: string | null
  amountPaid?: string | null
  paidAt?: string | null
  planName?: string | null
  departureDate?: Date | string | null
  returnDate?: Date | string | null
  email?: string | null
  failedAttempts?: number
  retryError?: string | null
  hideBackOnDesktop?: boolean
  isRetrying: boolean
  onRetry: () => void
  onDownloadPdf?: () => void
  onBack?: () => void
}

const PHT = 'Asia/Manila'

function toDate(value?: Date | string | null) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatPaidAt(value?: string | null) {
  const d = toDate(value)
  if (!d) return null
  const text = new Intl.DateTimeFormat('en-PH', {
    timeZone: PHT,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
  return `${text} PHT`
}

function formatTripDates(start?: Date | string | null, end?: Date | string | null) {
  const s = toDate(start)
  const e = toDate(end)
  if (!s) return null
  const fmt = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' })
  return e ? `${fmt.format(s)} to ${fmt.format(e)}` : fmt.format(s)
}

function formatAmount(value?: string | null) {
  const n = Number(value)
  if (!value || Number.isNaN(n)) return null
  return `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const PROGRESS_STEPS = [
  { key: 'payment', label: 'Payment', status: 'Received', state: 'done' },
  { key: 'policy', label: 'Policy', status: 'Needs attention', state: 'attention' },
  { key: 'email', label: 'Policy email', status: 'Waiting', state: 'pending' },
] as const

export function PaymentIssueError({
  proposalNumber,
  paymentReference,
  amountPaid,
  paidAt,
  planName,
  departureDate,
  returnDate,
  email,
  failedAttempts = 1,
  retryError,
  hideBackOnDesktop,
  isRetrying,
  onRetry,
  onDownloadPdf,
  onBack,
}: PaymentIssueErrorProps) {
  const escalated = failedAttempts - 1 >= SUPPORT.escalateAfterRetries
  const departure = toDate(departureDate)
  const urgent =
    !!departure && departure.getTime() - Date.now() < SUPPORT.urgentTripWithinHours * 60 * 60 * 1000

  const mailto = `mailto:${SUPPORT.email}?subject=${encodeURIComponent(
    `Policy issue – ${proposalNumber ?? 'unknown proposal'}`
  )}&body=${encodeURIComponent(
    `Hello,\n\nMy payment went through but my policy was not issued.\n\nProposal number: ${proposalNumber ?? ''}\nPayment reference: ${paymentReference ?? ''}\n`
  )}`

  const summary = [
    { label: 'Amount paid', value: formatAmount(amountPaid) },
    { label: 'Payment date', value: formatPaidAt(paidAt) },
    { label: 'Plan', value: planName },
    { label: 'Travel dates', value: formatTripDates(departureDate, returnDate) },
  ].filter((row): row is { label: string; value: string } => !!row.value)

  const retryButton = (
    <Button
      onClick={onRetry}
      disabled={isRetrying || !proposalNumber}
      size="lg"
      variant={escalated ? 'outline' : 'default'}
      className={cn(
        'min-h-11 w-full rounded-full font-semibold sm:w-auto sm:min-w-56',
        !escalated && 'from-primary to-lilac text-primary-foreground bg-gradient-to-r'
      )}
    >
      {isRetrying ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          Issuing your policy...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 size-4" aria-hidden />
          {escalated ? 'Try again' : 'Issue my policy'}
        </>
      )}
    </Button>
  )

  const supportButton = (
    <Button
      asChild
      size="lg"
      className="from-primary to-lilac text-primary-foreground min-h-11 w-full rounded-full bg-gradient-to-r font-semibold sm:w-auto sm:min-w-56"
    >
      <a href={mailto}>
        <Mail className="mr-2 size-4" aria-hidden />
        Contact support
      </a>
    </Button>
  )

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card className="bg-card gap-0 overflow-hidden p-0 shadow-none">
        <CardHeader className="px-5 pt-5 pb-3 sm:px-6" role="alert">
          <div className="flex items-start gap-3">
            <div className="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <TriangleAlert className="text-warning size-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <h2 className="text-primary text-xl font-semibold text-balance sm:text-3xl">
                Payment received, policy not issued yet
              </h2>
              <p className="text-foreground text-base">
                Your payment went through, but we hit a problem creating your policy.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-5 pt-3 pb-6 sm:px-6">
          <ol className="grid gap-2 sm:grid-cols-3" aria-label="Progress">
            {PROGRESS_STEPS.map((step) => {
              const Icon = step.state === 'done' ? CheckCircle2 : step.state === 'attention' ? TriangleAlert : Clock
              return (
                <li
                  key={step.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    step.state === 'done' && 'border-success/30 bg-success/5',
                    step.state === 'attention' && 'border-warning/40 bg-warning/10',
                    step.state === 'pending' && 'bg-muted/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 shrink-0',
                      step.state === 'done' && 'text-success',
                      step.state === 'attention' && 'text-warning',
                      step.state === 'pending' && 'text-muted-foreground'
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-semibold">{step.label}</p>
                    <p className="text-muted-foreground text-xs">{step.status}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="space-y-2">
            <p className="text-foreground flex items-center gap-2 text-base font-medium">
              <ShieldCheck className="text-success size-5 shrink-0" aria-hidden />
              You won&apos;t be charged again.
            </p>
            {SUPPORT.coverageStartsOnIssuance && (
              <p className="text-foreground text-base">Your coverage starts once your policy is issued.</p>
            )}
            {urgent && (
              <p className="border-warning/40 bg-warning/10 text-foreground rounded-lg border p-3 text-sm font-medium">
                Your trip starts soon. Please resolve this today so you&apos;re covered before you travel.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {retryError && !isRetrying && (
              <p role="alert" className="text-destructive text-sm font-medium">
                {retryError}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              {escalated ? (
                <>
                  {supportButton}
                  {retryButton}
                </>
              ) : (
                retryButton
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {escalated
                ? 'Our team can issue your policy for you. Your payment is safe.'
                : 'We\u2019ll try again. It\u2019s safe to retry, and you won\u2019t be charged twice.'}
            </p>
          </div>

          {summary.length > 0 && (
            <dl className="border-border grid grid-cols-1 gap-x-6 gap-y-3 border-t pt-6 sm:grid-cols-2">
              {summary.map((row) => (
                <div key={row.label}>
                  <dt className="text-muted-foreground text-xs">{row.label}</dt>
                  <dd className="text-foreground text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {(proposalNumber || paymentReference) && (
            <div className="space-y-2">
              <div className="grid gap-3">
                {proposalNumber && <ReferenceRow label="Proposal number" copyLabel="proposal number" value={proposalNumber} />}
                {paymentReference && (
                  <ReferenceRow label="Payment reference" copyLabel="payment reference" value={paymentReference} />
                )}
              </div>
              <p className="text-muted-foreground text-xs">Quote these when contacting support.</p>
            </div>
          )}

          <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
            <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Headset className="text-primary size-4" aria-hidden />
              Need help?
            </p>
            <p className="text-foreground text-base">
              Our team has been notified and will contact you within {SUPPORT.responseSlaHours} hours.
              {email ? (
                <>
                  {' '}Your policy will be emailed to <span className="font-medium wrap-anywhere">{email}</span> once ready.
                </>
              ) : (
                ' Your policy will be emailed to you once ready.'
              )}
            </p>
            <ul className="space-y-1 text-base">
              <li>
                <a
                  href={SUPPORT.phoneHref}
                  className="text-primary inline-flex min-h-11 items-center gap-2 hover:underline focus-visible:underline"
                >
                  <Phone className="size-4 shrink-0" aria-hidden />
                  {SUPPORT.phone}
                </a>
              </li>
              <li>
                <a
                  href={mailto}
                  className="text-primary inline-flex min-h-11 items-center gap-2 break-all hover:underline focus-visible:underline"
                >
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {SUPPORT.email}
                </a>
              </li>
            </ul>
            <p className="text-muted-foreground text-xs">
              Support hours: {SUPPORT.hours}. We reply within {SUPPORT.responseSlaHours} hours.
            </p>
          </div>

          {onDownloadPdf && proposalNumber && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="text-primary inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline focus-visible:underline"
            >
              <Download className="size-4" aria-hidden />
              Download proposal PDF
            </button>
          )}
        </CardContent>
      </Card>

      {onBack && (
        <div className={cn('flex gap-3', hideBackOnDesktop && 'lg:hidden')}>
          <Button onClick={onBack} variant="outline" size="lg" className="flex-1 rounded-full bg-transparent font-semibold">
            <ArrowLeft className="mr-2 size-4" />
            Back to Travel Insurance
          </Button>
        </div>
      )}
    </div>
  )
}

function ReferenceRow({ label, copyLabel, value }: { label: string; copyLabel: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <div className="bg-muted/30 flex items-center justify-between gap-2 rounded-lg border py-1 pr-1 pl-3">
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-foreground font-mono text-sm tracking-wide break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${copyLabel}`}
        className="text-muted-foreground hover:text-primary focus-visible:ring-ring flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {copied ? <Check className="text-success size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span>{copied ? 'Copied ✓' : 'Copy'}</span>
      </button>
    </div>
  )
}

export function ReferenceTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <div className={cn('rounded-lg border p-4', highlight ? 'border-primary/20 bg-primary/5' : 'bg-muted/30')}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs font-medium transition-colors"
        >
          {copied ? <Check className="text-success size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className={cn('font-mono text-sm font-bold break-all', highlight ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
    </div>
  )
}
