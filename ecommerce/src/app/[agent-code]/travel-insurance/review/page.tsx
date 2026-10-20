'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Loader2,
  Home,
  Mail,
  PlaneTakeoff,
  User,
  UserRound,
  Users,
  X,
  IdCard,
  Cake,
  HeartHandshake,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { TripSummary } from '@/components/travel-insurance/travel-sticky-bar'
import { ProposalQr } from '@/components/travel-insurance/proposal-qr'
import { ProposalRetrieve, type RetrieveNotice } from '@/components/travel-insurance/proposal-retrieve'
import {
  idFilesStore,
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { PH_ID_TYPES, type PersonalInfoFormData } from '@/types/travel-insurance/travel-insurance-request'
import { getCityNameByCityCode, getProvinceNameByProvCode } from '@/utils/address-util'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { formatBenefitLimit, groupBenefits } from '@/utils/travel-benefits'
import { toPHP } from '@/utils/fx'
import { formatDays, formatTripRange, getTripDays, titleCase } from '@/utils/trip-summary'
import {
  isProposalExpired,
  loadProposalIntoStore,
  PROPOSAL_VALIDITY_HOURS,
  proposalExpiresAt,
  RETRIEVED_PROPOSAL_KEY,
  type ProposalLoadResult,
} from '@/utils/proposal-loader'
import type { InsuranceBenefit } from '@/types/plan'

const money = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const mask = (v: string, keep = 3) => (v.length > keep ? `${'•'.repeat(v.length - keep)}${v.slice(-keep)}` : v)
const dateOf = (d?: Date | string | null) => {
  const x = d ? new Date(d) : null
  return x && !isNaN(x.getTime()) ? format(x, 'MMM d, yyyy') : ''
}

const addonLimit = (b: InsuranceBenefit) => {
  if (b.DefaultLimitDesc && b.DefaultLimitDesc !== '0') return b.DefaultLimitDesc
  const si = Number(b.Silimit)
  return si > 0 ? `Up to PHP ${si.toLocaleString('en-PH')}` : 'Included'
}

export default function Step4ReviewQuotePage() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ReviewRoute />
    </Suspense>
  )
}

function ReviewSkeleton() {
  return (
    <div className="w-full mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8" aria-busy="true">
      <div className="hidden sm:block mb-8 h-14 w-full animate-pulse rounded-lg bg-[#dfe7df] dark:bg-[#3d4140]" />

      <div className="mt-6 space-y-2">
        <div className="h-4 w-36 animate-pulse rounded bg-[var(--border)]" />
        <div className="h-8 sm:h-9 w-72 animate-pulse rounded-lg bg-[var(--border)]" />
        <div className="h-4 sm:h-5 w-96 max-w-full animate-pulse rounded bg-[var(--border)]" />
      </div>

      <div className="w-full travel-applicant-layout travel-review-layout mt-6 lg:mt-8">
        <div className="min-w-0 space-y-7">
          <div className="h-40 w-full animate-pulse rounded-lg bg-[var(--border)]" />
          <div className="h-56 w-full animate-pulse rounded-lg bg-[var(--border)]" />
          <div className="h-64 w-full animate-pulse rounded-lg bg-[var(--border)]" />
        </div>
        <div className="h-80 w-full animate-pulse rounded-lg bg-[var(--border)]" />
      </div>
      <span className="sr-only" role="status">
        Loading your proposal
      </span>
    </div>
  )
}

function ReviewRoute() {
  const router = useRouter()
  const params = useParams()
  const search = useSearchParams()
  const agentCode = (params['agent-code'] as string) || 'ckO6uNx2O6'
  const proposalParam = search.get('proposal')?.trim() || null

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const storedNo = useFullQuoteResponseStore((s) => s.apiResponse.data?.ProposalNo) || null
  const hasPlan = useTravelInsuranceStore((s) => !!s.coverageOption.selectedPlan)

  const target = proposalParam ?? storedNo
  const ready = !!target && target === storedNo && hasPlan
  const needsLoad = hydrated && !!target && !ready

  const [loaded, setLoaded] = useState<{ key: string; result: ProposalLoadResult } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!needsLoad || !target) return
    let cancelled = false
    loadProposalIntoStore(target).then((result) => {
      if (!cancelled) setLoaded({ key: `${target}:${attempt}`, result })
    })
    return () => {
      cancelled = true
    }
  }, [needsLoad, target, attempt])

  const loadResult = loaded?.key === `${target}:${attempt}` ? loaded.result : null
  const loading = needsLoad && !loadResult

  const startNewQuote = () => {
    useTravelInsuranceStore.getState().resetForm()
    useFullQuoteResponseStore.getState().resetApiResponse()
    idFilesStore.clear()
    router.push(`/${agentCode}/travel-insurance`)
  }

  const search_ = useCallback(
    (no: string) => {
      setAttempt((a) => a + 1)
      router.replace(`/${agentCode}/travel-insurance/review?proposal=${encodeURIComponent(no)}`)
    },
    [router, agentCode]
  )

  const retry = useCallback(() => {
    if (!target) return
    setAttempt((a) => a + 1)
  }, [target])

  let notice: RetrieveNotice = null
  if (loadResult && loadResult.status !== 'ok') {
    notice = {
      kind: loadResult.status,
      message:
        loadResult.status === 'issued' && loadResult.policyNo
          ? `${loadResult.message} Policy number: ${loadResult.policyNo}.`
          : loadResult.message,
    }
  }

  return (
    <>
      <Header agentCode={agentCode} currentStep={4} />
      {!hydrated || loading ? (
        <ReviewSkeleton />
      ) : ready ? (
        <ReviewContent agentCode={agentCode} onStartNewQuote={startNewQuote} />
      ) : (
        <div className="w-full mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <ProposalRetrieve
            key={`${target ?? ''}:${attempt}`}
            agentCode={agentCode}
            initialValue={target ?? ''}
            notice={notice}
            loading={false}
            onSearch={search_}
            onNewQuote={startNewQuote}
            onRetry={notice?.kind === 'unavailable' ? retry : undefined}
          />
        </div>
      )}
    </>
  )
}

function Disclosure({
  title,
  meta,
  children,
  open = true,
  className = '',
}: {
  title: string
  meta?: string
  children: React.ReactNode
  open?: boolean
  className?: string
}) {
  return (
    <details open={open} className={`travel-applicant-card travel-coverage review-collapsible ${className}`}>
      <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        <span className="ml-auto flex items-center gap-3 whitespace-nowrap text-sm">
          {meta}
          <ChevronDown className="size-5 shrink-0 transition-transform [details[open]_&]:rotate-180" aria-hidden />
        </span>
      </summary>
      {children}
    </details>
  )
}

function ReviewContent({ agentCode, onStartNewQuote }: { agentCode: string; onStartNewQuote: () => void }) {
  const router = useRouter()
  const { travelDetails, coverageOption, travelersInfo, setStep } = useTravelInsuranceStore()
  const apiData = useFullQuoteResponseStore((s) => s.apiResponse.data)
  const plan = coverageOption.selectedPlan!

  const proposalNo = apiData.ProposalNo
  const adults = travelDetails.noOfAdults || 1
  const total = adults + (travelDetails.noOfChildren || 0)
  const retrieved = useMemo(() => {
    try {
      return sessionStorage.getItem(RETRIEVED_PROPOSAL_KEY) === proposalNo
    } catch {
      return false
    }
  }, [proposalNo])

  const [copyStatus, setCopyStatus] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const cancelRef = useRef<HTMLDialogElement>(null)
  const cancelTrigger = useRef<HTMLButtonElement>(null)

  const provider = COMPANIES.find((c) => c.carrierCode === coverageOption.carrierCode)
  const brand = CARRIER_BRAND_COLORS[coverageOption.carrierCode]
  const insurer = provider?.companyName || plan.CarrierProductName || coverageOption.carrierCode
  const logo = brand?.cardLogoTight || brand?.planCardLogo || provider?.image || plan.LogoUrl
  const planName = plan.CarrierPlanDesc.trim()

  const benefitGroups = useMemo(() => groupBenefits(plan), [plan])
  const selectedAddons = useMemo(
    () =>
      Object.entries(groupPlanBenefits(plan).groupedAddonBenefits)
        .filter(([code, g]) => g.children.length > 0 && coverageOption.selectedAddonBenefits?.includes(code))
        .map(([code, g]) => ({ code, name: g.parent.CoverageName || g.parent.BenefitDesc, benefits: g.children })),
    [plan, coverageOption.selectedAddonBenefits]
  )

  const planPremium = toPHP(
    Number(plan.DuePremium || plan.GrossPremium || plan.BeforeVatPremium) || 0,
    plan.Currency || 'PHP'
  )
  const totalPremium = Number(apiData.DuePremium) || planPremium
  const beforeVat = Number(apiData.BeforeVatPremium) || 0
  const lgt = Number(apiData.LGT) || 0

  const detail = travelDetails.travelDetailList[0]
  const departure = new Date(travelDetails.departureDate)
  const returning = new Date(travelDetails.returnDate)
  const days = getTripDays(departure, returning)
  const origin = titleCase(detail?.PlaceOfOrgin) || 'Philippines'
  const destinations = travelDetails.travelDetailList
    .map((d) => titleCase(d.TravelCountry))
    .filter(Boolean)
    .join(', ')

  const expired = isProposalExpired(apiData)
  const validUntil = proposalExpiresAt(apiData)

  useEffect(() => {
    const el = cancelRef.current
    if (!el) return
    if (cancelOpen && !el.open) el.showModal()
    if (!cancelOpen && el.open) el.close()
  }, [cancelOpen])
  useEffect(() => {
    const el = cancelRef.current
    if (!el) return
    const onClose = () => {
      setCancelOpen(false)
      cancelTrigger.current?.focus()
    }
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [])

  useEffect(() => {
    const open = () =>
      document.querySelectorAll<HTMLDetailsElement>('details.review-collapsible').forEach((d) => {
        d.dataset.printWas = String(d.open)
        d.open = true
      })
    const restore = () =>
      document.querySelectorAll<HTMLDetailsElement>('details.review-collapsible').forEach((d) => {
        d.open = d.dataset.printWas === 'true'
        delete d.dataset.printWas
      })
    window.addEventListener('beforeprint', open)
    window.addEventListener('afterprint', restore)
    return () => {
      window.removeEventListener('beforeprint', open)
      window.removeEventListener('afterprint', restore)
    }
  }, [])

  const copyProposal = async () => {
    try {
      await navigator.clipboard.writeText(proposalNo)
      setCopyStatus('Proposal number copied.')
    } catch {
      setCopyStatus('Could not copy. Select the number and copy it manually.')
    }
    window.setTimeout(() => setCopyStatus(''), 3000)
  }

  const downloadPdf = async () => {
    setPdfBusy(true)
    setPdfError('')
    try {
      const { generateQuotePDF } = await import('@/utils/generate-quote-pdf')
      await generateQuotePDF({
        travelDetails,
        travelersInfo,
        apiResponse: useFullQuoteResponseStore.getState().apiResponse,
        planName,
        providerName: insurer,
        providerLogoUrl: brand?.cardLogoTight || brand?.planCardLogo || provider?.image || null,
        mainBenefits: plan.MainBenefits ?? [],
        addonBenefits: selectedAddons.flatMap((a) => a.benefits),
        agentCode,
        limitsUnavailable: retrieved,
        taxes: { premiumTax: plan.PremiumTaxAmt, stampDuty: plan.StampDuty },
      })
    } catch (err) {
      console.error('Proposal PDF failed:', err)
      setPdfError('We could not create the PDF. Please try again.')
    } finally {
      setPdfBusy(false)
    }
  }

  const proceed = () => {
    setStep(5)
    router.push(`/${agentCode}/travel-insurance/payment`)
  }

  const travellers = travelersInfo.length ? travelersInfo : []

  return (
    <>
      <div className="w-full mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">
        <div className="no-print">
          <TripSummary
            onEdit={() => {}}
            readOnlyLabel="Proposal generated · Read-only"
            premium={`PHP ${money(totalPremium)}`}
            hideFloatingBelowLg
          />
        </div>

        <p className="mt-6 hidden text-xs font-semibold uppercase tracking-wider text-[var(--primary)] sm:block dark:text-[#d0e3c8]">
          Travel insurance · Step 4 of 5
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Review your proposal</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-sub)] sm:text-base sm:leading-7">
          Your insurance proposal has been generated. Review the details below before proceeding to payment.
        </p>

        {expired ? (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 p-5 text-sm dark:border-red-800/40 dark:bg-red-900/10"
          >
            <h2 className="font-semibold text-red-800 dark:text-red-300">This proposal has expired</h2>
            <p className="mt-2 leading-6 text-red-800 dark:text-red-300">
              The validity period for this proposal has ended. Please generate a new quote to continue.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-[var(--field-border)] bg-[var(--subtle)] p-5">
            <h2 className="font-semibold">Need to change something?</h2>
            <p className="mt-2 text-sm leading-7">
              Generated proposals cannot be edited. To update your trip, plan or traveller information, cancel this
              and start a new quote.
            </p>
          </div>
        )}

        <div className="w-full travel-applicant-layout travel-review-layout">
          <div className="min-w-0 space-y-7">
            <section className="travel-applicant-card travel-review-reference" aria-labelledby="proposal-title">
              <ProposalQr proposalNo={proposalNo} agentCode={agentCode} />
              <div className="travel-review-reference__number min-w-0">
                <p id="proposal-title" className="text-sm text-[var(--text-muted)]">
                  Proposal number
                </p>
                <p className="mt-2 break-all text-lg font-semibold sm:text-2xl">{proposalNo}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {expired ? 'Expired proposal' : 'Generated proposal · Awaiting payment'}
                </p>
                {validUntil && !expired && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] sm:justify-start">
                    <Clock className="size-3.5" aria-hidden /> Pay by {format(validUntil, 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={copyProposal}
                className="no-print inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-transparent px-5 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] dark:text-[#f4f5f2]"
              >
                {copyStatus.startsWith('Proposal') ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                Copy number
              </button>
              <p className="text-sm" role="status">
                {copyStatus}
              </p>
            </section>

            <Disclosure title="Your travel details" className="travel-review-trip">
              <div className="mt-5">
                <div className="travel-review-trip__route">
                  <dl>
                    <dt>From</dt>
                    <dd>{origin}</dd>
                  </dl>
                  <span className="travel-review-trip__flight" aria-hidden>
                    <span />
                    <PlaneTakeoff className="size-5" />
                    <span />
                  </span>
                  <dl>
                    <dt>To</dt>
                    <dd>{destinations}</dd>
                  </dl>
                </div>
                <dl className="travel-review-trip__facts">
                  <div className="travel-review-trip__fact">
                    <dt>
                      <span className="travel-review-trip__icon">
                        <CalendarDays className="size-4" aria-hidden />
                      </span>
                      Travel dates
                    </dt>
                    <dd>{formatTripRange(departure, returning)}</dd>
                  </div>
                  <div className="travel-review-trip__fact">
                    <dt>
                      <span className="travel-review-trip__icon">
                        <Clock className="size-4" aria-hidden />
                      </span>
                      Duration
                    </dt>
                    <dd>{formatDays(days)}</dd>
                  </div>
                  <div className="travel-review-trip__fact">
                    <dt>
                      <span className="travel-review-trip__icon">
                        <Users className="size-4" aria-hidden />
                      </span>
                      Travellers
                    </dt>
                    <dd>{plural(total, 'traveller')}</dd>
                  </div>
                </dl>
              </div>
            </Disclosure>

            <Disclosure title="Plan coverage & benefits">
              <div className="mt-4">
                <div className="travel-coverage__plan">
                  <div className="travel-coverage__logo">
                    {logo && (
                      <Image
                        src={logo}
                        alt={insurer}
                        width={160}
                        height={64}
                        unoptimized
                        className="max-h-16 w-36 object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0 p-5 sm:p-6">
                    <p className="text-sm text-[var(--text-muted)]">{insurer}</p>
                    <h3 className="mt-1 text-base font-semibold sm:text-lg">{planName}</h3>
                  </div>
                </div>
                <div
                  className="travel-coverage__benefits mt-3"
                  role="region"
                  aria-label="Selected plan benefits"
                  tabIndex={0}
                >
                  {benefitGroups.map((group) => (
                    <section key={group.title} className="mb-5">
                      {benefitGroups.length > 1 && (
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)] dark:text-[#d0e3c8]">
                          {group.title}
                        </h4>
                      )}
                      <dl>
                        {group.rows.map((row, i) => (
                          <div key={i} className="travel-coverage__row">
                            <dt>{row.label}</dt>
                            <dd className="font-medium sm:text-right">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                  {!benefitGroups.length && (
                    <p className="text-sm text-[var(--text-muted)]">Benefit details are listed in your policy wording.</p>
                  )}
                </div>
              </div>
            </Disclosure>

            <Disclosure
              title="Selected add-ons"
              meta={selectedAddons.length ? `${selectedAddons.length} selected` : 'None selected'}
            >
              {selectedAddons.length ? (
                <ul className="mt-5 space-y-5">
                  {selectedAddons.map((a) => (
                    <li key={a.code} className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{a.name}</h3>
                        <div className="mt-2 space-y-1 text-sm leading-6 text-[var(--text-muted)]">
                          {a.benefits.map((b, i) => (
                            <p
                              key={`${b.BenefitCode}-${i}`}
                              className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3"
                            >
                              <span className="min-w-0">{b.BenefitDesc}</span>
                              <span className="shrink-0 font-medium">{addonLimit(b) || formatBenefitLimit(b)}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">Included</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">For {plural(total, 'traveller')}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-muted)]">No add-ons selected for this proposal.</p>
              )}
            </Disclosure>

            <section aria-labelledby="review-travellers-title">
              <h2 id="review-travellers-title" className="mb-4 text-lg font-semibold sm:text-xl">
                Traveller information
              </h2>
              {retrieved && (
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                  Some personal details are partly hidden because this proposal was retrieved by its number.
                </p>
              )}
              <div className="space-y-4">
                {travellers.map((t, i) => (
                  <TravellerReview key={i} index={i} isAdult={i < adults} t={t} masked={retrieved} />
                ))}
              </div>
            </section>
          </div>

          <aside className="travel-applicant-card travel-selected-plan" aria-labelledby="selected-plan-title">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] dark:text-[#d0e3c8]">
              Your selected plan
            </p>
            {logo && (
              <Image
                src={logo}
                alt={insurer}
                width={160}
                height={64}
                unoptimized
                className="my-5 max-h-16 w-36 rounded-md bg-white object-contain object-left p-1.5"
              />
            )}
            <p className="text-sm text-[var(--text-muted)]">{insurer}</p>
            <h2 id="selected-plan-title" className="mt-2 text-lg font-semibold">
              {planName}
            </h2>

            <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt>
                  {selectedAddons.length ? 'Plan & add-ons' : 'Base plan'} × {total}
                </dt>
                <dd>PHP {money(beforeVat || totalPremium - lgt)}</dd>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.code} className="flex justify-between gap-4 text-[var(--text-muted)]">
                  <dt>{a.name}</dt>
                  <dd className="shrink-0">Included</dd>
                </div>
              ))}
              {!selectedAddons.length && (
                <div className="flex justify-between gap-4 text-[var(--text-muted)]">
                  <dt>Add-ons</dt>
                  <dd>None selected</dd>
                </div>
              )}
              {lgt > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>Local government tax</dt>
                  <dd>PHP {money(lgt)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 border-t border-[var(--border)] pt-5" aria-live="polite" aria-atomic="true">
              <p className="text-sm">Total premium</p>
              <p className="mt-1 text-3xl font-semibold">PHP {money(totalPremium)}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">For {plural(total, 'traveller')}</p>
            </div>
            <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
              Premiums and cover are subject to insurer terms and conditions.
            </p>

            <div className="no-print">
              {expired ? (
                <button
                  type="button"
                  onClick={onStartNewQuote}
                  className="btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 py-3 text-base font-semibold"
                >
                  Start a new quote
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={proceed}
                    className="btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 py-3 text-base font-semibold"
                  >
                    Proceed to payment →
                  </button>
                  <button
                    ref={cancelTrigger}
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    aria-haspopup="dialog"
                    className="review-outline-btn mt-3 w-full"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdfBusy}
                className="review-outline-btn mt-3 w-full gap-2 disabled:opacity-60"
              >
                {pdfBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
                {pdfBusy ? 'Preparing PDF…' : 'Download proposal as PDF'}
              </button>
              {pdfError && (
                <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {pdfError}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile sticky action bar ── */}
      <div
        role="region"
        aria-label="Review proposal action bar"
        className="quote-sticky-bar sm:hidden no-print"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-main)]">PHP {money(totalPremium)}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">for {plural(total, 'traveller')}</p>
        </div>
        {expired ? (
          <button
            type="button"
            onClick={onStartNewQuote}
            className="btn-primary flex shrink-0 items-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            Start a new quote
          </button>
        ) : (
          <button
            type="button"
            onClick={proceed}
            className="btn-primary flex shrink-0 items-center gap-2 px-5 py-3 text-sm font-semibold"
          >
            Proceed to payment →
          </button>
        )}
      </div>

      <dialog
        ref={cancelRef}
        aria-labelledby="cancel-proposal-title"
        aria-describedby="cancel-proposal-description"
        className="travel-plan-dialog"
        onClick={(e) => e.target === cancelRef.current && setCancelOpen(false)}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="cancel-proposal-title" className="text-xl font-semibold">
            Cancel this proposal?
          </h2>
          <button
            type="button"
            onClick={() => setCancelOpen(false)}
            aria-label="Close dialog"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p id="cancel-proposal-description" className="mt-4 text-sm leading-7">
          You can cancel now and return to pay for this proposal within {PROPOSAL_VALIDITY_HOURS} hours of its creation.
        </p>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7">
          <li>Keep your proposal number so you can retrieve the proposal and resume payment.</li>
          <li>
            Complete payment within {PROPOSAL_VALIDITY_HOURS} hours of creating the proposal. After that, you will need
            to generate a new quote.
          </li>
          <li>
            Generated proposals cannot be edited. To change your trip, plan or traveller details, create a new quote.
            The premium and proposal number may change.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" autoFocus onClick={() => setCancelOpen(false)} className="review-outline-btn">
            Continue to payment
          </button>
          <button
            type="button"
            onClick={onStartNewQuote}
            className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold"
          >
            Cancel for now
          </button>
        </div>
      </dialog>
    </>
  )
}

function TravellerReview({
  index,
  isAdult,
  t,
  masked,
}: {
  index: number
  isAdult: boolean
  t: PersonalInfoFormData
  masked: boolean
}) {
  const name = [t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ') +
    (t.suffix && t.suffix !== 'No Suffix' ? `, ${t.suffix}` : '')
  const address = [
    t.address.line1,
    t.address.line2,
    getCityNameByCityCode(t.address.city) || t.address.city,
    getProvinceNameByProvCode(t.address.province) || t.address.province,
    t.address.zipCode,
  ]
    .filter(Boolean)
    .join(', ')
  const idType = PH_ID_TYPES[t.idType as keyof typeof PH_ID_TYPES] || t.idType
  const b = t.beneficiary
  const hasBeneficiary = !!b?.firstName
  const idNo = masked ? mask(t.idNumber) : t.idNumber
  const mobile = t.mobileNumber ? (masked ? `+63 ${mask(t.mobileNumber)}` : `+63 ${t.mobileNumber}`) : ''
  const email = masked && t.email ? t.email.replace(/^(.{2}).*(@.*)$/, '$1•••$2') : t.email

  const facts: { label: string; value: string; icon: React.ReactNode; cls?: string }[] = [
    { label: 'Date of birth', value: dateOf(t.dateOfBirth), icon: <Cake className="size-4" /> },
    { label: 'Gender', value: t.gender === 'F' ? 'Female' : t.gender === 'M' ? 'Male' : '', icon: <User className="size-4" /> },
    { label: 'Email address', value: email, icon: <Mail className="size-4" />, cls: 'travel-review-person__email' },
    { label: 'Mobile number', value: mobile, icon: <UserRound className="size-4" /> },
    { label: 'Identification', value: idNo ? `${idType} · ${idNo}` : '', icon: <IdCard className="size-4" /> },
    { label: 'Address', value: address, icon: <Home className="size-4" />, cls: 'travel-review-person__address' },
  ]
  if (hasBeneficiary) {
    facts.push(
      {
        label: 'Beneficiary',
        value: [b.firstName, b.middleName, b.lastName].filter(Boolean).join(' '),
        icon: <HeartHandshake className="size-4" />,
      },
      { label: 'Beneficiary date of birth', value: dateOf(b.dateOfBirth), icon: <Cake className="size-4" /> },
      { label: 'Relationship', value: b.relationship ?? '', icon: <Users className="size-4" /> }
    )
  }

  return (
    <details open className="travel-applicant-card travel-coverage travel-review-person review-collapsible">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span className="travel-review-person__identity">
          <span className="travel-review-person__avatar">
            <User className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="travel-review-person__caption">
              Traveller {index + 1} · {isAdult ? 'Adult' : 'Child'}
            </span>
            <h3 className="text-lg font-semibold">{name || 'Name not provided'}</h3>
          </span>
        </span>
        <ChevronDown className="size-5 shrink-0 transition-transform [details[open]_&]:rotate-180" aria-hidden />
      </summary>
      <dl className="travel-review-person__details">
        {facts.map((f) => (
          <div key={f.label} className={f.cls}>
            <dt>
              <span aria-hidden>{f.icon}</span>
              {f.label}
            </dt>
            <dd>{f.value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
