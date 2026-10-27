'use client'

import { Suspense, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Users,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { IssuanceProgressTracker, IssuanceStepper } from '@/components/travel-insurance/issuance-tracker'
import { IssueQuoteError, useIssueQuoteRequest } from '@/app/data/mutations/issue-quote-request'
import { usePaymentSync } from '@/app/data/mutations/payment'
import { useFullQuoteResponseStore, useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { formatTripRange, getTripDays, countryLabel } from '@/utils/trip-summary'
import { getPrincipal } from '@/utils/traveller-form'
import { cn } from '@/lib/utils'

type Stage = 'verifying' | 'issuing' | 'pending' | 'rejected' | 'unknown' | 'issueError' | 'noPayment' | 'noSession'

// DLT can take a while to record the payment — keep polling for ~90s
// before falling back to the manual "Check payment status" button.
const POLL_ATTEMPTS = 30
const POLL_DELAY_MS = 3000
const ISSUE_ATTEMPTS = 4
const ISSUE_RETRY_DELAY_MS = 5000
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
  const coverageOption = useTravelInsuranceStore((s) => s.coverageOption)
  const travelDetails = useTravelInsuranceStore((s) => s.travelDetails)
  const travelersInfo = useTravelInsuranceStore((s) => s.travelersInfo)
  const billing = useTravelInsuranceStore((s) => s.paymentBillingDetails)
  const submitted = useTravelInsuranceStore((s) => s.paymentSubmitResponse)
  const issued = useTravelInsuranceStore((s) => s.issueQuoteResponse)
  const selectedPaymentBrand = useTravelInsuranceStore((s) => s.selectedPaymentBrand)
  const proposalNo = apiData?.ProposalNo

  const returnTxn = searchParams.get('txn') || searchParams.get('reference_id')
  const returnStatus = searchParams.get('status') || (searchParams.get('reference_id') ? 'success' : null)
  // `paid=1`: the resumption check already confirmed payment server-side
  // (paid_not_issued) — skip DLT sync and go straight to issuance.  There may
  // be no local merchant_transaction_id (external payment), so fall back to
  // the proposal number as the reference; the IGW resolves it by proposal.
  const paidFlag = searchParams.get('paid') === '1'
  const txn = returnTxn || submitted?.data?.merchant_transaction_id || null
  const issueRef = txn || proposalNo || null
  const alreadyIssued = !!proposalNo && !!issued?.data?.policy_no && issued.data.proposal_number === proposalNo

  const [txnRef] = useState(txn)
  const [stage, setStage] = useState<Stage>(
    !proposalNo
      ? 'noSession'
      : alreadyIssued || paidFlag
        ? 'issuing'
        : !txn
          ? 'noPayment'
          : returnStatus === 'failure'
            ? 'rejected'
            : 'verifying',
  )
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [issueTry, setIssueTry] = useState(1)
  const started = useRef(false)
  const alive = useRef(true)

  const { mutateAsync: syncPayment } = usePaymentSync()
  const { mutateAsync: issueQuote } = useIssueQuoteRequest()

  const email = billing?.email || getPrincipal(travelersInfo)?.email || ''

  const goToPolicy = () => {
    useTravelInsuranceStore.getState().setStep(7)
    router.replace(`${base}/policy`)
  }

  const issue = async (paidTxn: string, paymentStatus = 'paid') => {
    setStage('issuing')
    setError(null)
    setIssueTry(1)
    const state = useTravelInsuranceStore.getState()
    const issueQuoteRequest = {
      proposal_number: proposalNo!,
      payment: {
        reference: paidTxn,
        status: paymentStatus,
      },
      custom_field: {
        plan_name: plan?.CarrierPlanDesc?.trim() || apiData?.ProductName || apiData?.ProductCode || '',
        ...(state.selectedPaymentBrand?.value ? { payment_brand: state.selectedPaymentBrand.value } : {}),
      },
    }
    // Each call already retries server-side (~100s); retry here too before
    // surfacing the needs-attention page. Idempotent on the backend.
    for (let i = 1; i <= ISSUE_ATTEMPTS; i++) {
      try {
        const res = await issueQuote({ issueQuoteRequest })
        state.setIssueQuoteResponse(res)
        state.setPolicyNo(res.data?.policy_no ?? '')
        return goToPolicy()
      } catch (err) {
        if (!alive.current) return
        const status = err instanceof IssueQuoteError ? err.status : undefined
        const permanent = !!status && status >= 400 && status < 500 && ![400, 408, 429].includes(status)
        if (permanent || i === ISSUE_ATTEMPTS) {
          setError(err instanceof Error ? err.message : 'We couldn\u2019t create your policy this time.')
          return setStage('issueError')
        }
        await sleep(ISSUE_RETRY_DELAY_MS * i)
        if (!alive.current) return
        setIssueTry(i + 1)
      }
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
      if (status === 'PAID') return issue(paidTxn, status.toLowerCase())
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
    if (stage === 'issuing' && issueRef) return issue(issueRef)
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

  // Derived trip data for NeedsAttention
  const detail = travelDetails.travelDetailList[0]
  const departure = new Date(travelDetails.departureDate)
  const returning = new Date(travelDetails.returnDate)
  const days = getTripDays(departure, returning)
  const origin = countryLabel(detail?.PlaceOfOrgin) || 'Philippines'
  const destinations = travelDetails.travelDetailList.map((d) => countryLabel(d.TravelCountry)).filter(Boolean).join(', ')
  const adults = travelDetails.noOfAdults || 1
  const travellers = adults + (travelDetails.noOfChildren || 0)
  const tripRange = formatTripRange(departure, returning)
  const fullRoute = [origin, destinations, origin].filter(Boolean).join(' \u2192 ')

  const totalPremium = Number(apiData?.DuePremium) || Number(apiData?.GrossPremium) || 0
  const planName = plan?.CarrierPlanDesc?.trim() || apiData?.ProductName || ''

  const provider = COMPANIES.find((c) => c.carrierCode === coverageOption.carrierCode)
  const brand = CARRIER_BRAND_COLORS[coverageOption.carrierCode]
  const logo = brand?.cardLogoTight || brand?.planCardLogo || provider?.image || plan?.LogoUrl
  const insurerName = provider?.companyName || plan?.CarrierProductName || coverageOption.carrierCode

  // Payment-page style premium breakdown
  const selectedAddons = useMemo(
    () =>
      plan
        ? Object.entries(groupPlanBenefits(plan).groupedAddonBenefits)
            .filter(([code, g]) => g.children.length > 0 && coverageOption.selectedAddonBenefits?.includes(code))
            .map(([code, g]) => ({
              code,
              name: g.parent.CoverageName || g.parent.BenefitDesc,
            }))
        : [],
    [plan, coverageOption.selectedAddonBenefits],
  )
  const lgt = Number(apiData?.LGT) || 0
  const beforeVat = Number(apiData?.BeforeVatPremium) || 0
  const paymentMethod = selectedPaymentBrand?.value || ''

  // Payment date from submitted response timestamp
  const paymentDate = submitted?.data?.timestamp
    ? new Date(submitted.data.timestamp)
    : null
  const paymentDateStr = paymentDate
    ? paymentDate.toLocaleString('en-PH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short',
      })
    : null

  // Shared sidebar + layout props
  const sidebarProps = {
    base,
    logo: logo ?? null,
    insurerName,
    totalPremium,
    planName,
    paymentDateStr,
    paymentMethod,
    paymentRef: txn,
    addons: selectedAddons,
    lgt,
    basePremium: beforeVat || totalPremium - lgt,
    travellers,
  }

  return (
    <>
      <Header agentCode={agentCode} />
      <main id="main" className="travel-results travel-issuance-main">
        {stage === 'verifying' || stage === 'issuing' ? (
          <section
            className="travel-applicant-card travel-issuance-card"
            aria-labelledby="issuance-title"
            aria-describedby="issuance-description"
          >
            <h1
              id="issuance-title"
              className="text-2xl font-semibold tracking-tight text-[#006838] dark:text-[#d0e3c8] sm:text-3xl"
            >
              Finalizing your policy
            </h1>
            <p id="issuance-description" className="mt-3 text-sm leading-7 text-[#333] dark:text-[#c4c7c5]">
              Please keep this page open. We&rsquo;re getting your electronic Certificate of Coverage (eCOC) and
              acknowledgement receipt ready.
            </p>

            <IssuanceStepper stage={stage} issueTry={issueTry} issueTries={ISSUE_ATTEMPTS} />

            <div className="travel-issuance-email">
              <Mail className="mt-0.5 size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden />
              <p className="text-sm leading-7 text-[#333] dark:text-[#c4c7c5]">
                Once your policy is issued, we&rsquo;ll send your eCOC and acknowledgement receipt to{' '}
                {email ? (
                  <strong className="break-all font-semibold">{email}</strong>
                ) : (
                  'the applicant\u2019s email address'
                )}
                .
              </p>
            </div>
          </section>
        ) : stage === 'issueError' ? (
          <NeedsAttention
            proposalNo={proposalNo}
            txn={txn}
            attempt={attempt}
            base={base}
            origin={origin}
            destinations={destinations}
            fullRoute={fullRoute}
            tripRange={tripRange}
            days={days}
            travellers={travellers}
            onIssue={() => issueRef && issue(issueRef)}
            setAttempt={setAttempt}
            aliveRef={alive}
            sidebarProps={sidebarProps}
          />
        ) : (
          <section
            className="travel-applicant-card travel-issuance-card"
            aria-labelledby="issuance-title"
            aria-describedby="issuance-description"
          >
            <Outcome
              stage={stage}
              error={error}
              proposalNo={proposalNo}
              txn={txn}
              base={base}
              attempt={attempt}
              onRetry={recheck}
              onIssue={() => issueRef && issue(issueRef)}
            />
          </section>
        )}
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// PaymentSidebar — shared right-rail for both loading and error states
// ---------------------------------------------------------------------------

interface PaymentSidebarProps {
  base: string
  logo: string | null
  insurerName: string
  totalPremium: number
  planName: string
  paymentDateStr: string | null
  paymentMethod: string
  paymentRef: string | null
  addons: { code: string; name: string }[]
  lgt: number
  basePremium: number
  travellers: number
}

function PaymentSidebar({
  base,
  logo,
  insurerName,
  totalPremium,
  planName,
  paymentDateStr,
  paymentMethod,
  paymentRef,
  addons,
  lgt,
  basePremium,
  travellers,
}: PaymentSidebarProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  return (
    <aside aria-label="Payment received summary">
      <div className="travel-applicant-card space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#006838] dark:text-[#d0e3c8]">
          PAYMENT RECEIVED
        </h2>

        {logo && (
          <div className="flex items-center">
            <Image
              src={logo}
              alt={insurerName}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          </div>
        )}
        {insurerName && <p className="text-sm text-[#59645d] dark:text-[#8fa494]">{insurerName}</p>}
        {planName && (
          <p className="text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">{planName}</p>
        )}

        <hr className="border-[#dfe7df] dark:border-[#3d4140]" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#006838] dark:text-[#d0e3c8]">Payment details</h3>
          {paymentMethod && (
            <SidebarRow label="Payment method" value={paymentMethod} />
          )}
          {paymentDateStr && (
            <SidebarRow label="Payment date" value={paymentDateStr} />
          )}
          {paymentRef && (
            <SidebarRow label="Payment reference" value={paymentRef} />
          )}
        </div>

        <hr className="border-[#dfe7df] dark:border-[#3d4140]" />

        {/* Premium breakdown — mirrors the payment step's selected-plan summary */}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt>
              {addons.length ? 'Plan & add-ons' : 'Base plan'} × {travellers}
            </dt>
            <dd>PHP {fmt(basePremium)}</dd>
          </div>
          {addons.map((a) => (
            <div key={a.code} className="flex justify-between gap-4 text-[#59645d] dark:text-[#8fa494]">
              <dt>{a.name}</dt>
              <dd className="shrink-0">Included</dd>
            </div>
          ))}
          {!addons.length && (
            <div className="flex justify-between gap-4 text-[#59645d] dark:text-[#8fa494]">
              <dt>Add-ons</dt>
              <dd>None selected</dd>
            </div>
          )}
          {lgt > 0 && (
            <div className="flex justify-between gap-4">
              <dt>Local government tax</dt>
              <dd>PHP {fmt(lgt)}</dd>
            </div>
          )}
        </dl>

        {totalPremium > 0 && (
          <>
            <hr className="border-[#dfe7df] dark:border-[#3d4140]" />
            <div>
              <p className="text-sm text-[#59645d] dark:text-[#8fa494]">Total premium paid</p>
              <p className="mt-1 text-2xl font-bold text-[#006838] dark:text-[#d0e3c8]">
                &#x20B1;{fmt(totalPremium)}
              </p>
              <p className="mt-1 text-xs text-[#59645d] dark:text-[#8fa494]">
                For {travellers} {travellers === 1 ? 'traveller' : 'travellers'}
              </p>
            </div>
          </>
        )}

        <Link
          href={`${base}`}
          className="inline-flex w-full min-h-11 items-center justify-center rounded-md border border-[#006838] px-4 py-2.5 text-sm font-semibold text-[#006838] hover:bg-[#f0f7f3] dark:border-[#d0e3c8] dark:text-[#d0e3c8] dark:hover:bg-[#1e2f24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]"
        >
          Back to travel insurance
        </Link>
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// TravelDetailsDisclosure — collapsible trip summary, same details as the
// payment step's "Travel details" card. Shared by the loading and
// needs-attention states.
// ---------------------------------------------------------------------------

interface TravelDetailsDisclosureProps {
  origin: string
  destinations: string
  fullRoute: string
  tripRange: string
  days: number
  travellers: number
  defaultOpen?: boolean
}

function TravelDetailsDisclosure({
  origin,
  destinations,
  fullRoute,
  tripRange,
  days,
  travellers,
  defaultOpen = false,
}: TravelDetailsDisclosureProps) {
  const [detailsOpen, setDetailsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-md border border-[#dfe7df] dark:border-[#3d4140]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-4 text-left"
        aria-expanded={detailsOpen}
        aria-controls="travel-details-panel"
        onClick={() => setDetailsOpen((o) => !o)}
      >
        <span className="text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Your travel details</span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-[#59645d] transition-transform duration-200 dark:text-[#c4c7c5]',
            detailsOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {detailsOpen && (
        <div id="travel-details-panel" className="border-t border-[#dfe7df] px-4 pb-5 pt-4 dark:border-[#3d4140]">
          {/* Origin → Destination route graphic */}
          <div className="rounded-md bg-[#f7f8f7] px-4 py-4 dark:bg-[#1e2120]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[#59645d] dark:text-[#8fa494]">From</p>
                <p className="mt-0.5 text-base font-semibold">{origin}</p>
              </div>
              {/* Dashed flight arrow */}
              <div className="flex flex-1 items-center gap-1 px-2" aria-hidden="true">
                <div className="h-px flex-1 border-t border-dashed border-[#c7d4c9] dark:border-[#3d4140]" />
                <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#59645d]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 22h20M6.36 17.4 4 17l-2-4 1.1-.35a2 2 0 0 1 1.4.07l.74.32 2.07 4.02" />
                  <path d="m10.96 4.66-.3 1.11a2 2 0 0 0 .45 1.87l5.37 5.85a2 2 0 0 0 1.59.64l2.47-.16-9.58-9.31Z" />
                  <path d="m13.96 3.19-8.09 8.09a2 2 0 0 0-.46 2.11l.62 1.67 9.37-11.04-.98-.84a2 2 0 0 0-1.46-.77Z" />
                </svg>
                <div className="h-px flex-1 border-t border-dashed border-[#c7d4c9] dark:border-[#3d4140]" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-xs text-[#59645d] dark:text-[#8fa494]">To</p>
                <p className="mt-0.5 text-base font-semibold">{destinations || '\u2014'}</p>
              </div>
            </div>
          </div>

          {/* Full route string */}
          {fullRoute && (
            <p className="mt-3 text-sm text-[#59645d] dark:text-[#8fa494]">{fullRoute}</p>
          )}

          {/* Date / Duration / Travellers row */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#59645d] dark:text-[#8fa494]" aria-hidden />
              <div>
                <p className="text-xs text-[#59645d] dark:text-[#8fa494]">Travel dates</p>
                <p className="mt-0.5 text-sm font-medium">{tripRange}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-[#59645d] dark:text-[#8fa494]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
              <div>
                <p className="text-xs text-[#59645d] dark:text-[#8fa494]">Duration</p>
                <p className="mt-0.5 text-sm font-medium">{days} {days === 1 ? 'day' : 'days'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 size-4 shrink-0 text-[#59645d] dark:text-[#8fa494]" aria-hidden />
              <div>
                <p className="text-xs text-[#59645d] dark:text-[#8fa494]">Travellers</p>
                <p className="mt-0.5 text-sm font-medium">{travellers} {travellers === 1 ? 'traveller' : 'travellers'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NeedsAttention — full two-column layout for the issueError state
// ---------------------------------------------------------------------------

interface NeedsAttentionProps {
  proposalNo?: string
  txn: string | null
  attempt: number
  base: string
  origin: string
  destinations: string
  fullRoute: string
  tripRange: string
  days: number
  travellers: number
  onIssue: () => void
  setAttempt: React.Dispatch<React.SetStateAction<number>>
  aliveRef: React.MutableRefObject<boolean>
  sidebarProps: PaymentSidebarProps
}

function NeedsAttention({
  proposalNo,
  txn,
  attempt,
  base,
  origin,
  destinations,
  fullRoute,
  tripRange,
  days,
  travellers,
  onIssue,
  setAttempt,
  aliveRef,
  sidebarProps,
}: NeedsAttentionProps) {
  const [copiedProposal, setCopiedProposal] = useState(false)
  const [copiedTxn, setCopiedTxn] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const copy = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleRetry = () => {
    aliveRef.current = true
    setAttempt((n) => n + 1)
    setIsRetrying(true)
    // The parent's onIssue sets stage back to 'issuing', which will hide this component
    onIssue()
  }

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#006838] dark:text-[#d0e3c8]">
        TRAVEL INSURANCE / PAYMENT
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
        {/* ── Main card ── */}
        <div className="travel-applicant-card space-y-6" role="alert" aria-live="assertive">

          {/* Header with icon + title */}
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              aria-hidden="true"
            >
              <AlertTriangle className="size-5" />
            </span>
            <h1
              id="issuance-title"
              className="text-2xl font-semibold tracking-tight text-[#183d2c] dark:text-[#f4f5f2] sm:text-3xl"
            >
              Payment received, policy not issued yet
            </h1>
          </div>

          {/* Three-state tracker — same stepper as the loading state */}
          <IssuanceProgressTracker stage="issueError" />

          {/* Reassurance notice */}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Please do not make another payment.
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-400">
              We’ve emailed you an update. Our team is working to resolve the issue with your policy and will keep
              you informed. Your coverage is confirmed only once your policy is issued. If your trip starts soon,
              contact us with the references below.
            </p>
          </div>

          {/* Retry CTA */}
          <div>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {isRetrying ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              {attempt > 0 ? 'Try again' : 'Try issuing my policy'}
            </button>
          </div>

          {/* Travel details disclosure */}
          <TravelDetailsDisclosure
            origin={origin}
            destinations={destinations}
            fullRoute={fullRoute}
            tripRange={tripRange}
            days={days}
            travellers={travellers}
            defaultOpen
          />

          {/* References */}
          <div>
            <h2 className="text-base font-semibold text-[#006838] dark:text-[#d0e3c8]">References</h2>
            <div className="mt-3 space-y-3">
              {proposalNo && (
                <ReferenceRow
                  label="Proposal number"
                  value={proposalNo}
                  copied={copiedProposal}
                  onCopy={() => copy(proposalNo, setCopiedProposal)}
                />
              )}
              {txn && (
                <ReferenceRow
                  label="Payment reference"
                  value={txn}
                  copied={copiedTxn}
                  onCopy={() => copy(txn, setCopiedTxn)}
                />
              )}
            </div>
            <p className="mt-3 text-sm text-[#59645d] dark:text-[#8fa494]">
              Quote these references when contacting us.
            </p>
          </div>

          {/* Need help */}
          <div className="rounded-md border border-[#dfe7df] px-4 py-4 dark:border-[#3d4140]">
            <h2 className="text-base font-semibold text-[#006838] dark:text-[#d0e3c8]">Need help?</h2>
            <p className="mt-1 text-sm leading-6 text-[#333] dark:text-[#c4c7c5]">
              Contact IFRC Insurance about this paid proposal. Keep your proposal and payment references handy.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <a
                href="tel:+63286335681"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#006838] hover:underline dark:text-[#d0e3c8]"
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                (02) 8633 5681
              </a>
              <a
                href="mailto:sales@ifrcinsurance.com"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#006838] hover:underline dark:text-[#d0e3c8]"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                sales@ifrcinsurance.com
              </a>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <PaymentSidebar {...sidebarProps} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReferenceRow — label + monospace value + copy button
// ---------------------------------------------------------------------------

function ReferenceRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-[#dfe7df] px-4 py-3 dark:border-[#3d4140]">
      <div className="min-w-0">
        <p className="text-xs text-[#59645d] dark:text-[#8fa494]">{label}</p>
        <p className="mt-0.5 break-all font-semibold">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        className="shrink-0 text-sm font-semibold text-[#006838] hover:underline dark:text-[#d0e3c8]"
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <Check className="size-3.5" aria-hidden />
            Copied
          </span>
        ) : (
          'Copy'
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SidebarRow — label/value pair for the payment sidebar
// ---------------------------------------------------------------------------

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#59645d] dark:text-[#8fa494]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Outcome — simple fallback for non-issueError stages
// ---------------------------------------------------------------------------

const OUTCOMES: Record<
  Exclude<Stage, 'verifying' | 'issuing' | 'issueError'>,
  { title: string; body: string; action?: 'recheck' | 'issue' | 'payment' | 'review' }
> = {
  pending: {
    title: 'Your payment is still being processed',
    body: 'We haven\u2019t received a final confirmation yet. Please don\u2019t pay again \u2014 check the status again in a moment.',
    action: 'recheck',
  },
  unknown: {
    title: 'We couldn\u2019t confirm your payment',
    body: 'We couldn\u2019t reach the payment provider. Check the status before paying again \u2014 paying again without verifying may cause a duplicate charge.',
    action: 'recheck',
  },
  rejected: {
    title: 'Your payment wasn\u2019t completed',
    body: 'No policy has been issued and nothing was confirmed as paid. You can go back and try again with another payment method.',
    action: 'payment',
  },
  noPayment: {
    title: 'We couldn\u2019t find a payment to confirm',
    body: 'Go back to the payment step to start or resume your payment.',
    action: 'payment',
  },
  noSession: {
    title: 'We couldn\u2019t find your proposal',
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
  stage: Exclude<Stage, 'verifying' | 'issuing' | 'issueError'>
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
          <AlertTriangle className="mt-1 size-7 shrink-0" aria-hidden />
        )}
        {o.title}
      </h1>
      <p id="issuance-description" className="mt-3 text-sm leading-7 text-[#333] dark:text-[#c4c7c5]">
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
        {o.action === 'recheck' && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            <RefreshCw className="size-4" aria-hidden />
            Check payment status
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
