'use client'

import { Suspense, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, FileCheck2, Loader2, Mail, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { useIssueQuoteRequest } from '@/app/data/mutations/issue-quote-request'
import { usePaymentSync } from '@/app/data/mutations/payment'
import { useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'

type Stage = 'verifying' | 'issuing' | 'pending' | 'rejected' | 'unknown' | 'issueError' | 'noPayment' | 'noSession'

const POLL_ATTEMPTS = 6
const POLL_DELAY_MS = 3000
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function PolicyIssuancePage() {
  return (
    <Suspense fallback={null}>
      <IssuanceRoute />
    </Suspense>
  )
}

function IssuanceRoute() {
  const params = useParams()
  const agentCode = (params['agent-code'] as string) || 'ckO6uNx2O6'
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  if (!hydrated) {
    return (
      <>
        <Header agentCode={agentCode} />
        <main id="main" className="travel-results travel-issuance-main" aria-busy="true">
          <div className="travel-applicant-card travel-issuance-card h-80 animate-pulse" />
        </main>
      </>
    )
  }
  return <IssuanceContent agentCode={agentCode} />
}

function IssuanceContent({ agentCode }: { agentCode: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const base = `/${agentCode}/travel-insurance`

  const apiData = useFullQuoteResponseStore((s) => s.apiResponse.data)
  const plan = useTravelInsuranceStore((s) => s.coverageOption.selectedPlan)
  const travelersInfo = useTravelInsuranceStore((s) => s.travelersInfo)
  const billing = useTravelInsuranceStore((s) => s.paymentBillingDetails)
  const submitted = useTravelInsuranceStore((s) => s.paymentSubmitResponse)
  const issued = useTravelInsuranceStore((s) => s.issueQuoteResponse)
  const proposalNo = apiData?.ProposalNo

  const returnTxn = searchParams.get('txn') || searchParams.get('reference_id')
  const returnStatus = searchParams.get('status') || (searchParams.get('reference_id') ? 'success' : null)
  const txn = returnTxn || submitted?.data?.merchant_transaction_id || null
  const alreadyIssued = !!proposalNo && !!issued?.data?.policy_no && issued.data.proposal_number === proposalNo

  const [txnRef] = useState(txn)
  const [stage, setStage] = useState<Stage>(
    !proposalNo
      ? 'noSession'
      : alreadyIssued
        ? 'issuing'
        : !txn
          ? 'noPayment'
          : returnStatus === 'failure'
            ? 'rejected'
            : 'verifying',
  )
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const started = useRef(false)
  const alive = useRef(true)

  const { mutateAsync: syncPayment } = usePaymentSync()
  const { mutateAsync: issueQuote } = useIssueQuoteRequest()

  const email = billing?.email || travelersInfo?.[0]?.email || ''

  const goToPolicy = () => {
    useTravelInsuranceStore.getState().setStep(7)
    router.replace(`${base}/policy`)
  }

  const issue = async (paidTxn: string) => {
    setStage('issuing')
    setError(null)
    try {
      const state = useTravelInsuranceStore.getState()
      const res = await issueQuote({
        issueQuoteRequest: {
          proposal_number: proposalNo!,
          payment: { reference: paidTxn },
          CustomField: {
            PlanName: plan?.CarrierPlanDesc?.trim() || apiData?.ProductName || apiData?.ProductCode || '',
            ...(state.selectedPaymentBrand?.value ? { PaymentBrand: state.selectedPaymentBrand.value } : {}),
          },
        },
      })
      state.setIssueQuoteResponse(res)
      state.setPolicyNo(res.data?.policy_no ?? '')
      goToPolicy()
    } catch (err) {
      if (!alive.current) return
      setError(err instanceof Error ? err.message : 'We couldn’t create your policy this time.')
      setStage('issueError')
    }
  }

  const verify = async (paidTxn: string) => {
    setStage('verifying')
    setError(null)
    for (let i = 0; i < POLL_ATTEMPTS; i++) {
      if (!alive.current) return
      let status: string
      try {
        status = (await syncPayment({ merchant_transaction_id: paidTxn })).data.payment_status
      } catch {
        if (alive.current) setStage('unknown')
        return
      }
      if (status === 'PAID') return issue(paidTxn)
      if (status === 'REJECTED') {
        if (alive.current) setStage('rejected')
        return
      }
      if (i < POLL_ATTEMPTS - 1) await sleep(POLL_DELAY_MS)
    }
    if (alive.current) setStage('pending')
  }

  const start = useEffectEvent(() => {
    if (alreadyIssued) return goToPolicy()
    if (stage === 'verifying' && txnRef) verify(txnRef)
  })

  useEffect(() => {
    alive.current = true
    if (!started.current) {
      started.current = true
      start()
    }
    return () => {
      alive.current = false
    }
  }, [])

  const recheck = () => {
    if (!txn) return
    alive.current = true
    setAttempt((n) => n + 1)
    verify(txn)
  }

  const active = stage === 'verifying' ? 0 : 1
  const showTimeline = stage === 'verifying' || stage === 'issuing'

  return (
    <>
      <Header agentCode={agentCode} />
      <main id="main" className="travel-results travel-issuance-main">
        <section
          className="travel-applicant-card travel-issuance-card"
          aria-labelledby="issuance-title"
          aria-describedby="issuance-description"
        >
          {showTimeline ? (
            <>
              <h1
                id="issuance-title"
                className="text-2xl font-semibold tracking-tight text-[#006838] dark:text-[#d0e3c8] sm:text-3xl"
              >
                Finalizing your policy
              </h1>
              <p
                id="issuance-description"
                className="mt-3 text-sm leading-7 text-[#333] dark:text-[#c4c7c5]"
              >
                Please keep this page open. We’re confirming your payment and getting your electronic Certificate of
                Coverage (eCOC) and acknowledgement receipt ready.
              </p>

              <ol className="travel-journey is-enhanced travel-issuance-steps" aria-label="Policy issuance progress">
                <li
                  className={`travel-journey__step is-active${active > 0 ? ' is-done' : ''}`}
                  aria-current={active === 0 ? 'step' : undefined}
                >
                  <span className="travel-journey__marker" aria-hidden="true">
                    {active > 0 ? '✓' : <span className="travel-issuance-spinner is-spinning" />}
                  </span>
                  <div className="travel-journey__panel">
                    <h2 className="travel-journey__title text-lg font-semibold sm:text-xl">
                      {active > 0 ? 'Payment confirmed' : 'Confirming your payment'}
                      <span className="sr-only"> — {active > 0 ? 'completed' : 'in progress'}</span>
                    </h2>
                    <p
                      className="mt-2 text-base leading-7 text-[#333] dark:text-[#c4c7c5]"
                      role={active === 0 ? 'status' : undefined}
                    >
                      {active > 0 ? 'Your payment has been received.' : 'Checking with the payment provider'}
                    </p>
                  </div>
                </li>
                <li
                  className={`travel-journey__step${active === 1 ? ' is-active' : ''}`}
                  aria-current={active === 1 ? 'step' : undefined}
                >
                  <span className="travel-journey__marker" aria-hidden="true">
                    {active === 1 ? (
                      <span className="travel-issuance-spinner is-spinning" />
                    ) : (
                      <FileCheck2 className="size-6" />
                    )}
                  </span>
                  <div className="travel-journey__panel">
                    <h2 className="travel-journey__title text-lg font-semibold sm:text-xl">
                      Issuing your policy
                      <span className="sr-only"> — {active === 1 ? 'in progress' : 'pending'}</span>
                    </h2>
                    <p
                      className="mt-2 text-base leading-7"
                      role={active === 1 ? 'status' : undefined}
                    >
                      {active === 1 ? 'Recording your policy with the insurer' : 'Starts once your payment is confirmed.'}
                    </p>
                  </div>
                </li>
                <li className="travel-journey__step">
                  <span className="travel-journey__marker" aria-hidden="true">
                    <FileCheck2 className="size-6" />
                  </span>
                  <div className="travel-journey__panel">
                    <h2 className="travel-journey__title text-lg font-semibold sm:text-xl">
                      Preparing Certificate of Coverage and acknowledgement receipt
                      <span className="sr-only"> — pending</span>
                    </h2>
                    <p className="mt-2 text-base leading-7">
                      Your documents will be sent to the applicant’s email address.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="travel-issuance-email">
                <Mail className="mt-0.5 size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
                <p className="text-sm leading-7 text-[#333] dark:text-[#c4c7c5]">
                  Once your policy is issued, we’ll send your eCOC and acknowledgement receipt to{' '}
                  {email ? <strong className="break-all font-semibold">{email}</strong> : 'the applicant’s email address'}.
                </p>
              </div>
            </>
          ) : (
            <Outcome
              stage={stage}
              error={error}
              proposalNo={proposalNo}
              txn={txn}
              base={base}
              attempt={attempt}
              onRetry={recheck}
              onIssue={() => txn && issue(txn)}
            />
          )}
        </section>
      </main>
    </>
  )
}

const OUTCOMES: Record<
  Exclude<Stage, 'verifying' | 'issuing'>,
  { title: string; body: string; action?: 'recheck' | 'issue' | 'payment' | 'review' }
> = {
  pending: {
    title: 'Your payment is still being processed',
    body: 'We haven’t received a final confirmation yet. Please don’t pay again — check the status again in a moment.',
    action: 'recheck',
  },
  unknown: {
    title: 'We couldn’t confirm your payment',
    body: 'We couldn’t reach the payment provider. Check the status before paying again — paying again without verifying may cause a duplicate charge.',
    action: 'recheck',
  },
  rejected: {
    title: 'Your payment wasn’t completed',
    body: 'No policy has been issued and nothing was confirmed as paid. You can go back and try again with another payment method.',
    action: 'payment',
  },
  issueError: {
    title: 'Your payment was received, but your policy isn’t issued yet',
    body: 'Your payment is safe. Keep the references below and try again.',
    action: 'issue',
  },
  noPayment: {
    title: 'We couldn’t find a payment to confirm',
    body: 'Go back to the payment step to start or resume your payment.',
    action: 'payment',
  },
  noSession: {
    title: 'We couldn’t find your proposal',
    body: 'Your session may have expired. Enter your proposal number to retrieve it.',
    action: 'review',
  },
}

function Outcome({
  stage,
  error,
  proposalNo,
  txn,
  base,
  attempt,
  onRetry,
  onIssue,
}: {
  stage: Exclude<Stage, 'verifying' | 'issuing'>
  error: string | null
  proposalNo?: string
  txn: string | null
  base: string
  attempt: number
  onRetry: () => void
  onIssue: () => void
}) {
  const o = OUTCOMES[stage]
  const warn = stage === 'pending' || stage === 'unknown'
  return (
    <div role="alert">
      <h1
        id="issuance-title"
        className="flex items-start gap-3 text-2xl font-semibold tracking-tight text-[#006838] dark:text-[#d0e3c8] sm:text-3xl"
      >
        {warn ? (
          <Loader2 className="mt-1 size-7 shrink-0" aria-hidden />
        ) : (
          <AlertCircle className="mt-1 size-7 shrink-0" aria-hidden />
        )}
        {o.title}
      </h1>
      <p id="issuance-description" className="mt-3 text-sm leading-7 text-[#333] dark:text-[#c4c7c5]">
        {stage === 'issueError' && error ? `${error} ` : ''}
        {o.body}
      </p>
      {(proposalNo || txn) && stage !== 'noSession' && (
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          {proposalNo && (
            <div>
              <dt className="text-xs text-[#59645d] dark:text-[#c4c7c5]">Proposal number</dt>
              <dd className="mt-1 break-all font-semibold">{proposalNo}</dd>
            </div>
          )}
          {txn && (
            <div>
              <dt className="text-xs text-[#59645d] dark:text-[#c4c7c5]">Payment reference</dt>
              <dd className="mt-1 break-all font-semibold">{txn}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        {(o.action === 'recheck' || o.action === 'issue') && (
          <button
            type="button"
            onClick={o.action === 'issue' ? onIssue : onRetry}
            className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            <RefreshCw className="size-4" aria-hidden />
            {o.action === 'issue' ? (attempt > 0 ? 'Try again' : 'Issue my policy') : 'Check payment status'}
          </button>
        )}
        {o.action === 'payment' && (
          <Link
            href={`${base}/payment`}
            className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-3 text-sm font-semibold"
          >
            Back to payment
          </Link>
        )}
        {o.action === 'review' && (
          <Link
            href={`${base}/review`}
            className="btn-primary inline-flex min-h-11 items-center justify-center px-5 py-3 text-sm font-semibold"
          >
            Retrieve my proposal
          </Link>
        )}
      </div>
    </div>
  )
}
