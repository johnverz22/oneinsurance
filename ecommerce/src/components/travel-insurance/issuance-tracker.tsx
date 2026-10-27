'use client'

import { AlertTriangle, Check, Circle, FileCheck2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type IssuanceStage = 'verifying' | 'issuing' | 'issueError'

// ---------------------------------------------------------------------------
// IssuanceStepper — vertical progress list (`.travel-journey` classes) for the
// issuance waiting state, per the policy-issuance mockup.
// ---------------------------------------------------------------------------

type StepState = 'done' | 'active' | 'pending'

export function IssuanceStepper({
  stage,
  issueTry = 1,
  issueTries = 1,
}: {
  stage: Exclude<IssuanceStage, 'issueError'>
  issueTry?: number
  issueTries?: number
}) {
  const verifying = stage === 'verifying'
  const steps: { title: string; text: string; state: StepState; status?: boolean; icon?: React.ReactNode }[] = [
    verifying
      ? { title: 'Confirming your payment', text: 'Checking with the payment provider', state: 'active', status: true }
      : { title: 'Payment confirmed', text: 'Your payment has been received.', state: 'done' },
    {
      title: 'Issuing your policy',
      text:
        issueTry > 1
          ? `Still recording your policy with the insurer \u2014 trying again (${issueTry} of ${issueTries}). Please don\u2019t pay again.`
          : 'Recording your policy with the insurer',
      state: verifying ? 'pending' : 'active',
      status: !verifying,
    },
    {
      title: 'Preparing Certificate of Coverage and acknowledgement receipt',
      text: 'Your documents will be sent to the applicant\u2019s email address.',
      state: 'pending',
      icon: <FileCheck2 aria-hidden />,
    },
  ]
  const label = { done: ' \u2014 completed', active: ' \u2014 in progress', pending: ' \u2014 pending' }

  return (
    <ol className="travel-journey is-enhanced travel-issuance-steps" aria-label="Policy issuance progress">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className={cn('travel-journey__step', s.state !== 'pending' && 'is-active', s.state === 'done' && 'is-done')}
          aria-current={s.state === 'active' ? 'step' : undefined}
        >
          <span className="travel-journey__marker" aria-hidden="true">
            {s.state === 'done' ? (
              <Check />
            ) : s.state === 'active' ? (
              <span className="travel-issuance-spinner" />
            ) : (
              (s.icon ?? <span className="text-sm font-semibold">{i + 1}</span>)
            )}
          </span>
          <div className="travel-journey__panel">
            <h2 className="travel-journey__title text-lg font-semibold sm:text-xl">
              {s.title}
              <span className="sr-only">{label[s.state]}</span>
            </h2>
            <p
              className="mt-2 text-base leading-7 text-[#333] dark:text-[#c4c7c5]"
              role={s.status ? 'status' : undefined}
            >
              {s.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// IssuanceProgressTracker — compact horizontal 3-step tracker used by the
// issuance page's needs-attention state.
// ---------------------------------------------------------------------------

export function IssuanceProgressTracker({ stage }: { stage: IssuanceStage }) {
  const step1Done = stage !== 'verifying'
  const step2Active = stage === 'issuing'
  const step2Error = stage === 'issueError'

  return (
    <div aria-label="Policy issuance progress" role="status">
      <ol className="flex items-start gap-0">
        {/* Step 1 — Payment */}
        <li className="flex flex-1 flex-col items-center">
          <div className="relative flex w-full items-center">
            <div className="flex-1" aria-hidden />
            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                step1Done
                  ? 'border-[#006838] bg-[#006838] text-white dark:border-[#00aa5e] dark:bg-[#00aa5e]'
                  : 'border-[#006838] bg-white text-[#006838] dark:border-[#d0e3c8] dark:bg-[#1c1e1e] dark:text-[#d0e3c8]',
              )}
            >
              {step1Done ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
            </span>
            <div
              className={cn(
                'h-0.5 flex-1',
                step1Done ? 'bg-[#006838] dark:bg-[#00aa5e]' : 'bg-[#dfe7df] dark:bg-[#3d4140]',
              )}
              aria-hidden
            />
          </div>
          <div className="mt-2 px-1 text-center">
            <p className={cn('text-xs font-semibold', step1Done ? 'text-[#006838] dark:text-[#d0e3c8]' : 'text-[#183d2c] dark:text-[#f4f5f2]')}>
              {step1Done ? 'Payment confirmed' : 'Confirming payment'}
            </p>
            <p className="mt-0.5 text-xs text-[#59645d] dark:text-[#8fa494]">
              {step1Done ? 'Payment received.' : 'Checking with provider…'}
            </p>
          </div>
        </li>

        {/* Step 2 — Policy recording */}
        <li className="flex flex-1 flex-col items-center">
          <div className="relative flex w-full items-center">
            <div
              className={cn(
                'h-0.5 flex-1',
                step1Done
                  ? step2Error
                    ? 'bg-amber-400 dark:bg-amber-600'
                    : 'bg-[#006838] dark:bg-[#00aa5e]'
                  : 'bg-[#dfe7df] dark:bg-[#3d4140]',
              )}
              aria-hidden
            />
            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                step2Error
                  ? 'border-amber-500 bg-amber-50 text-amber-600 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-400'
                  : step2Active
                    ? 'border-[#006838] bg-white text-[#006838] dark:border-[#d0e3c8] dark:bg-[#1c1e1e] dark:text-[#d0e3c8]'
                    : 'border-[#c7d4c9] bg-white text-[#59645d] dark:border-[#3d4140] dark:bg-[#1e2120] dark:text-[#8fa494]',
              )}
            >
              {step2Error ? (
                <AlertTriangle className="size-4" aria-hidden />
              ) : step2Active ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Circle className="size-4" aria-hidden />
              )}
            </span>
            <div className="h-0.5 flex-1 bg-[#dfe7df] dark:bg-[#3d4140]" aria-hidden />
          </div>
          <div className="mt-2 px-1 text-center">
            <p className={cn(
              'text-xs font-semibold',
              step2Error || step2Active ? 'text-[#183d2c] dark:text-[#f4f5f2]' : 'text-[#59645d] dark:text-[#8fa494]',
            )}>
              Policy recording
            </p>
            <p className={cn('mt-0.5 text-xs', step2Error ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-[#59645d] dark:text-[#8fa494]')}>
              {step2Error ? 'Needs attention' : step2Active ? 'Recording with insurer…' : 'Waiting for payment'}
            </p>
          </div>
        </li>

        {/* Step 3 — Documents */}
        <li className="flex flex-1 flex-col items-center">
          <div className="relative flex w-full items-center">
            <div className="h-0.5 flex-1 bg-[#dfe7df] dark:bg-[#3d4140]" aria-hidden />
            <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[#c7d4c9] bg-white text-[#59645d] dark:border-[#3d4140] dark:bg-[#1e2120] dark:text-[#8fa494]">
              <FileCheck2 className="size-4" aria-hidden />
            </span>
            <div className="flex-1" aria-hidden />
          </div>
          <div className="mt-2 px-1 text-center">
            <p className="text-xs font-semibold text-[#59645d] dark:text-[#8fa494]">Policy email</p>
            <p className="mt-0.5 text-xs text-[#59645d] dark:text-[#8fa494]">Waiting for issuance</p>
          </div>
        </li>
      </ol>
    </div>
  )
}
