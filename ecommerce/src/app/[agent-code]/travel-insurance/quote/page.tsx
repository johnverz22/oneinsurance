'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { ModifySearchModal } from '@/components/travel-insurance/modify-search-modal'
import { TripSummary } from '@/components/travel-insurance/travel-sticky-bar'
import { TravellerCard } from '@/components/travel-insurance/traveller-card'
import { DataSharingDialog, ReviewDialog } from '@/components/travel-insurance/quote-dialogs'
import {
  idFilesStore,
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { useFullQuoteRequest } from '@/app/data/mutations/full-quote-request'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { FullQuoteResponse, FullQuoteResponseSchema } from '@/types/travel-insurance/policy-types'
import { PersonalInfoFormData } from '@/types/travel-insurance/travel-insurance-request'
import { igwFullQuoteToPolicyData, mapToIgwFullQuoteRequest } from '@/utils/mappers/travel-insurance/full-quote'
import { groupPlanBenefits } from '@/utils/travel-benefits-helpers'
import { formatBenefitLimit, groupBenefits } from '@/utils/travel-benefits'
import { KeyConditions } from '@/components/travel-insurance/key-conditions'
import { emptyTraveller, fieldRulesForCarrier, principalIndex, travellerOf, validateTravellers } from '@/utils/traveller-form'
import { toPHP } from '@/utils/fx'
import { formatDays, formatTripRange, getTripDays, titleCase, countryLabel } from '@/utils/trip-summary'
import type { InsuranceBenefit } from '@/types/plan'

const money = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const addonLimit = (b: InsuranceBenefit) => {
  const limit = formatBenefitLimit(b)
  if (limit !== '—') return limit
  if (b.DefaultLimitDesc && b.DefaultLimitDesc !== '0') return b.DefaultLimitDesc
  const si = Number(b.Silimit)
  return si > 0 ? `Up to PHP ${si.toLocaleString('en-PH')}` : 'Included'
}

/* ── Critical notice (spec D) ── */
function ProposalNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--subtle)] px-4 py-3 text-sm"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-[var(--primary)] dark:text-[#d0e3c8]" aria-hidden />
      <p className="leading-5 text-[var(--text-sub)]">
        Generated proposals cannot be edited. Changes require cancellation and a new quote.
      </p>
    </div>
  )
}

export default function Step3GenerateQuotePage() {
  const router = useRouter()
  const params = useParams()
  const agentCode = (params['agent-code'] as string) || 'ckO6uNx2O6'
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const hasPlan = useTravelInsuranceStore((s) => !!s.coverageOption.selectedPlan)
  const hasTrip = useTravelInsuranceStore((s) => !!s.travelDetails.travelDetailList?.[0]?.TravelCountry)
  const [modifyOpen, setModifyOpen] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!hasTrip) router.replace(`/${agentCode}/travel-insurance`)
    else if (!hasPlan && !modifyOpen) router.replace(`/${agentCode}/travel-insurance/plans`)
  }, [hydrated, hasTrip, hasPlan, modifyOpen, router, agentCode])

  const handleModified = () => {
    useTravelInsuranceStore.getState().resetCoverageOption()
    idFilesStore.clear()
    setModifyOpen(false)
    router.push(`/${agentCode}/travel-insurance/plans`)
  }

  return (
    <>
      <Header agentCode={agentCode} currentStep={3} onEditTrip={() => setModifyOpen(true)} />
      {hydrated && hasPlan && hasTrip ? (
        <QuoteContent agentCode={agentCode} onEditTrip={() => setModifyOpen(true)} />
      ) : (
        <div className="w-full mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8" aria-busy="true">
          <div className="hidden sm:block mb-8 h-14 w-full animate-pulse rounded-lg bg-[#dfe7df] dark:bg-[#3d4140]" />
          <div className="sm:hidden mt-4 h-11 w-full animate-pulse rounded-lg bg-[var(--border)]" />

          <div className="mt-6 space-y-2">
            <div className="h-8 sm:h-9 w-64 animate-pulse rounded-lg bg-[var(--border)]" />
            <div className="h-4 sm:h-5 w-96 max-w-full animate-pulse rounded bg-[var(--border)]" />
          </div>

          <div className="w-full quote-page-layout mt-6 lg:mt-8">
            <div className="min-w-0 space-y-6">
              <div className="h-44 w-full animate-pulse rounded-lg bg-[var(--border)]" />
              <div className="h-96 w-full animate-pulse rounded-lg bg-[var(--border)]" />
            </div>
            <div className="hidden lg:block h-72 w-full animate-pulse rounded-lg bg-[var(--border)]" />
          </div>
        </div>
      )}
      <ModifySearchModal
        agentCode={agentCode}
        open={modifyOpen}
        onClose={() => setModifyOpen(false)}
        onSubmitted={handleModified}
      />
    </>
  )
}

function QuoteContent({ agentCode, onEditTrip }: { agentCode: string; onEditTrip: () => void }) {
  const router = useRouter()
  const {
    travelDetails,
    coverageOption,
    travelersInfo,
    clientRequest,
    updateTravelersInfo,
    updateCoverageOption,
    setStep,
    setRefCode,
  } = useTravelInsuranceStore()
  const { setApiResponse } = useFullQuoteResponseStore()
  const { mutateAsync: requestFullQuote, isPending: submitting } = useFullQuoteRequest()

  const plan = coverageOption.selectedPlan!
  const adults = travelDetails.noOfAdults || 1
  const total = adults + (travelDetails.noOfChildren || 0)

  const [initialPrincipal] = useState(() => {
    const saved = principalIndex(travelersInfo)
    return saved < total ? saved : 0
  })
  const [travellers, setTravellers] = useState<PersonalInfoFormData[]>(() =>
    Array.from({ length: total }, (_, i) => {
      const saved = travelersInfo[i] ?? emptyTraveller()
      let data = { ...saved, idFrontUploaded: !!idFilesStore.get(i)?.frontId, idBackUploaded: !!idFilesStore.get(i)?.backId }

      // Pre-fill traveller 1's date of birth from the landing-page DOB field when
      // the traveller form hasn't been filled in yet (firstName still blank) and
      // a real DOB was captured on the landing page (not the 1990-01-01 default).
      if (i === 0 && !saved.firstName) {
        const landingDob = travelDetails.dateOfBirth
        if (
          landingDob instanceof Date &&
          !isNaN(landingDob.getTime()) &&
          landingDob.toISOString().split('T')[0] !== '1990-01-01'
        ) {
          data = { ...data, dateOfBirth: landingDob }
        }
      }

      data = { ...data, isPrincipalApplicant: i === initialPrincipal }

      return data
    })
  )
  const [openIdx, setOpenIdx] = useState<Set<number>>(() => new Set([0]))
  const [principalIdx, setPrincipalIdx] = useState(initialPrincipal)
  const [attempted, setAttempted] = useState(false)
  const [agreementOpen, setAgreementOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [submitError, setSubmitError] = useState<{ message: string; details: string[] } | null>(null)
  const [addons, setAddons] = useState<string[]>(coverageOption.selectedAddonBenefits ?? [])
  const [planExpanded, setPlanExpanded] = useState(false)
  // Track which traveller cards have an active ID scan so the submit button
  // can be disabled while any scan is in-flight.
  const [scanningTravellers, setScanningTravellers] = useState<Set<number>>(() => new Set())
  const anyScanning = scanningTravellers.size > 0

  /* Input focus detection for hiding sticky bar on mobile */
  const [inputFocused, setInputFocused] = useState(false)
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') setInputFocused(true)
    }
    const onBlur = () => setInputFocused(false)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onBlur)
    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onBlur)
    }
  }, [])

  useEffect(() => {
    updateTravelersInfo(travellers)
  }, [travellers, updateTravelersInfo])

  const carrierCode = coverageOption.carrierCode
  const fieldRules = useMemo(() => fieldRulesForCarrier(carrierCode), [carrierCode])

  /* Auto-expand next traveller when current completes */
  const errors = useMemo(() => validateTravellers(travellers, adults, fieldRules), [travellers, adults, fieldRules])

  const handleTravellerChange = useCallback(
    (i: number, update: (prev: PersonalInfoFormData) => PersonalInfoFormData) => {
      setTravellers((prev) => {
        const next = prev.map((p, j) => (j === i ? update(p) : p))
        // Auto-expand next traveller if this one just became error-free
        const wasComplete =
          !Object.keys(validateTravellers(prev, adults, fieldRules)).some((k) => k.startsWith(`${i}.`))
        const isNowComplete =
          !Object.keys(validateTravellers(next, adults, fieldRules)).some((k) => k.startsWith(`${i}.`))
        if (!wasComplete && isNowComplete && i < total - 1) {
          setOpenIdx((s) => new Set([...s, i + 1]))
        }
        return next
      })
    },
    [adults, total, fieldRules]
  )

  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
  const brand = CARRIER_BRAND_COLORS[carrierCode]
  const insurer = provider?.companyName || plan.CarrierProductName || carrierCode
  const logo = brand?.cardLogoTight || brand?.planCardLogo || provider?.image || plan.LogoUrl
  const currency = plan.Currency || 'PHP'
  const basePremium = toPHP(Number(plan.DuePremium || plan.GrossPremium || plan.BeforeVatPremium) || 0, currency)
  const planName = plan.CarrierPlanDesc.trim()

  const benefitGroups = useMemo(() => groupBenefits(plan), [plan])
  const addonGroups = useMemo(
    () =>
      Object.entries(groupPlanBenefits(plan).groupedAddonBenefits)
        .filter(([, g]) => g.children.length > 0)
        .map(([code, g]) => ({
          code,
          name: g.parent.CoverageName || g.parent.BenefitDesc,
          benefits: g.children,
        })),
    [plan]
  )
  const chosenAddons = addonGroups.filter((a) => addons.includes(a.code))

  const toggleAddon = (code: string, checked: boolean) => {
    const next = checked ? [...addons, code] : addons.filter((c) => c !== code)
    setAddons(next)
    updateCoverageOption({ selectedAddonBenefits: next })
  }

  const focusFirstError = useCallback((keys: string[]) => {
    // Wait for the traveller accordions to expand before hunting for the field
    window.setTimeout(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-field]')).filter((el) =>
        keys.includes(el.dataset.field ?? '')
      )
      const el = els[0]
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
    }, 120)
  }, [])

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    const keys = Object.keys(errors)
    if (keys.length) {
      const bad = new Set(keys.map(travellerOf))
      setOpenIdx((prev) => new Set([...prev, ...bad]))
      // Focus + scroll to the first invalid field; the role=alert summary
      // above the form announces the error count on its own.
      focusFirstError(keys)
      return
    }
    setSubmitError(null)
    setReviewOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    try {
      const request = mapToIgwFullQuoteRequest(
        { travelDetails, coverageOption: { ...coverageOption, selectedAddonBenefits: addons }, travelersInfo: travellers },
        clientRequest.id ?? '',
        agentCode
      )
      const response = await requestFullQuote({
        fullQuoteRequest: request,
        idImages: Array.from(idFilesStore.entries())
          .filter(([i, f]) => f.frontId && f.backId && travellers[i])
          .map(([i, f]) => ({
            fileName: `${travellers[i].firstName.toLowerCase()}-${travellers[i].lastName.toLowerCase()}`,
            frontId: f.frontId!,
            backId: f.backId!,
          })),
      })

      if (!response?.success || !response.data) {
        setSubmitError({
          message: response?.message || 'We could not create your quote.',
          details: Object.values(response?.errors ?? {}).flat() as string[],
        })
        return
      }

      const policyData = igwFullQuoteToPolicyData(response.data, {
        travelDetails,
        coverageOption: { ...coverageOption, selectedAddonBenefits: addons },
        travelersInfo: travellers,
      })
      const apiResponse: FullQuoteResponse = { success: true, message: response.message, data: policyData }
      FullQuoteResponseSchema.parse(apiResponse)
      try {
        localStorage.setItem(`proposal_${policyData.ProposalNo}`, JSON.stringify(policyData))
      } catch {
        // storage unavailable — proposal still lives in the session store
      }
      setApiResponse(apiResponse)
      setRefCode(policyData.ProposalNo)
      setStep(4)
      router.push(`/${agentCode}/travel-insurance/review`)
    } catch (err) {
      console.error('Full quote failed:', err)
      setSubmitError({ message: 'Something went wrong while creating your quote. Please try again.', details: [] })
    }
  }

  const detail = travelDetails.travelDetailList[0]
  const departure = new Date(travelDetails.departureDate)
  const returning = new Date(travelDetails.returnDate)
  const days = getTripDays(departure, returning)
  const route = `${countryLabel(detail?.PlaceOfOrgin) || 'Philippines'} → ${travelDetails.travelDetailList.map((d) => countryLabel(d.TravelCountry)).join(', ')}`

  const hasErrors = attempted && Object.keys(errors).length > 0
  const errorCount = Object.keys(errors).length

  return (
    <>
      {/* ── Main page wrapper — extra bottom padding for sticky bar on mobile ── */}
      <div className="w-full mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pt-8 sm:pb-10 lg:px-8">

        {/* Desktop: show TripSummary inline (it manages its own floating state).
            Mobile: trip summary is shown inline as compact chip row — see below. */}
        <TripSummary onEdit={onEditTrip} premium={`PHP ${money(basePremium)}`} />

        {/* ── Mobile compact trip chip (spec E) ── */}
        <div className="sm:hidden mt-4">
          <button
            type="button"
            onClick={onEditTrip}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--subtle)] px-3 py-2.5 text-left text-sm"
          >
            <span className="min-w-0 truncate text-[var(--text-sub)]">
              {countryLabel(detail?.PlaceOfOrgin) || 'PH'} → {travelDetails.travelDetailList.map((d) => countryLabel(d.TravelCountry)).join(', ')} · {formatTripRange(departure, returning)} · {plural(total, 'traveller')}
            </span>
            <span className="shrink-0 text-xs font-semibold text-[var(--primary)] dark:text-[#d0e3c8]">Modify</span>
          </button>
        </div>

        {/* ── Page heading (spec E: no eyebrow on mobile, keep title + subtitle) ── */}
        <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">Quote details</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-sub)] sm:text-base sm:leading-7">
          {addonGroups.length > 0
            ? 'Review your plan, select add-ons and enter traveller details to generate your quote.'
            : 'Review your plan and enter traveller details to generate your quote.'}
        </p>

        {/* ── Error summary (spec A) ── */}
        {hasErrors && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-800/40 dark:bg-red-900/10"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
            <p className="text-red-800 dark:text-red-300">
              Please fix {plural(errorCount, 'field')} highlighted below before continuing.
            </p>
          </div>
        )}

        {/* ── Two-column layout (spec C) ── */}
        <div className="w-full quote-page-layout mt-6 lg:mt-8">

          {/* ── Left: form column ── */}
          <div className="flex min-w-0 flex-col gap-6">

            {/* Plan coverage accordion */}
            <details open className="travel-applicant-card travel-coverage">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
                <h2 className="text-lg font-semibold sm:text-xl">Plan coverage &amp; benefits</h2>
                <ChevronDown className="size-5 shrink-0 transition-transform [details[open]_&]:rotate-180" aria-hidden />
              </summary>
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
                            <dd className="font-medium sm:text-right">
                              {row.value}
                              {row.note && <span className="travel-benefit-note">{row.note}</span>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                  <KeyConditions className="mt-0" />
                </div>
              </div>
            </details>

            {/* ── Mobile compact plan summary row (spec E) ── */}
            <div className="order-first sm:order-none lg:hidden">
              <div className="travel-applicant-card p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPlanExpanded((v) => !v)}
                  aria-expanded={planExpanded}
                  aria-controls="mobile-plan-details"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  {logo && (
                    <Image
                      src={logo}
                      alt=""
                      width={28}
                      height={28}
                      unoptimized
                      aria-hidden
                      className="size-7 shrink-0 rounded object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{planName}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{insurer}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[var(--primary)] dark:text-[#d0e3c8]">
                      PHP {money(basePremium)}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">total</p>
                  </div>
                  <ChevronRight
                    className={`ml-1 size-4 shrink-0 text-[var(--text-muted)] transition-transform ${planExpanded ? 'rotate-90' : ''}`}
                    aria-hidden
                  />
                </button>

                {planExpanded && (
                  <div id="mobile-plan-details" className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                    <dl className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-[var(--text-muted)]">Base plan × {total}</dt>
                        <dd>PHP {money(basePremium)}</dd>
                      </div>
                      {chosenAddons.length > 0
                        ? chosenAddons.map((a) => (
                            <div key={a.code} className="flex justify-between gap-4">
                              <dt className="text-[var(--text-muted)]">{a.name}</dt>
                              <dd>Added</dd>
                            </div>
                          ))
                        : (
                          <div className="flex justify-between gap-4">
                            <dt className="text-[var(--text-muted)]">Add-ons</dt>
                            <dd className="text-[var(--text-muted)]">None</dd>
                          </div>
                        )}
                    </dl>
                    <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
                      <div>
                        <p className="text-sm font-semibold">Total premium</p>
                        <p className="text-xl font-semibold">PHP {money(basePremium)}</p>
                        <p className="text-xs text-[var(--text-muted)]">For {plural(total, 'traveller')}</p>
                      </div>
                      <Link
                        href={`/${agentCode}/travel-insurance/plans`}
                        className="text-sm font-semibold text-[var(--primary)] underline underline-offset-4 dark:text-[#d0e3c8]"
                      >
                        Change plan
                      </Link>
                    </div>
                    <ProposalNotice />
                  </div>
                )}
              </div>
            </div>

            {/* Optional add-ons — always shown, content conditional */}
            <details className="travel-applicant-card travel-addons">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
                <h2 className="text-lg font-semibold sm:text-xl">Optional add-ons</h2>
                <span className="flex items-center gap-3 text-sm">
                  {addonGroups.length === 0
                    ? 'None available'
                    : addons.length
                    ? `${addons.length} selected`
                    : 'None selected'}
                  <ChevronDown className="travel-addons__chevron size-5 shrink-0" aria-hidden />
                </span>
              </summary>
              {addonGroups.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  No optional add-ons are available for this plan.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Select additional cover for your plan. Add-on pricing is applied when your quote is generated.
                  </p>
                  <div className="mt-6 space-y-3">
                    {addonGroups.map((addon) => {
                      const selected = addons.includes(addon.code)
                      return (
                        <label key={addon.code} className={`travel-addon${selected ? ' is-selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => toggleAddon(addon.code, e.target.checked)}
                            className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="travel-addon-title block font-semibold">{addon.name}</span>
                            <span className="travel-addon-copy mt-2 block space-y-1 text-sm leading-6">
                              {addon.benefits.map((b, i) => (
                                <span key={`${b.BenefitCode}-${i}`} className="flex justify-between gap-3">
                                  <span className="min-w-0">{b.BenefitDesc}</span>
                                  <span className="shrink-0 font-medium">{addonLimit(b)}</span>
                                </span>
                              ))}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-xs text-[var(--text-muted)]">Priced at submission</span>
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </details>

            {/* Traveller form */}
            <form noValidate className="space-y-5" onSubmit={handleReview} id="traveller-form">
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">Traveller information</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                  Enter details as shown on each traveller&apos;s ID.
                </p>
                {total > 1 && (
                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                    The <strong className="font-semibold text-[var(--text-sub)]">principal applicant</strong> is the policyholder. Their contact details are used for the policy and payment. Use &ldquo;Make principal&rdquo; on a traveller to change it.
                  </p>
                )}
              </div>

              {travellers.map((t, i) => (
                <TravellerCard
                  key={i}
                  index={i}
                  isAdult={i < adults}
                  data={t}
                  errors={errors}
                  showErrors={attempted}
                  open={openIdx.has(i)}
                  onToggle={(open) =>
                    setOpenIdx((prev) => {
                      if (prev.has(i) === open) return prev
                      const next = new Set(prev)
                      if (open) next.add(i)
                      else next.delete(i)
                      return next
                    })
                  }
                  onChange={(update) => handleTravellerChange(i, update)}
                  onOpenAgreement={() => setAgreementOpen(true)}
                  isPrincipal={principalIdx === i}
                  onSetPrincipal={() => {
                    setPrincipalIdx(i)
                    // Keep isPrincipalApplicant in sync on every traveller so
                    // the mapper can read it directly from the travellers array.
                    setTravellers((prev) =>
                      prev.map((t, j) => ({ ...t, isPrincipalApplicant: j === i }))
                    )
                  }}
                  principalTraveller={i !== principalIdx ? travellers[principalIdx] : undefined}
                  rules={fieldRules}
                  onScanningChange={(scanning) =>
                    setScanningTravellers((prev) => {
                      const next = new Set(prev)
                      if (scanning) next.add(i)
                      else next.delete(i)
                      return next
                    })
                  }
                />
              ))}

              {/* ── Desktop: notice above CTA (spec D) ── */}
              <div className="hidden sm:block lg:hidden">
                <ProposalNotice />
              </div>
              <div className="hidden lg:block">
                <ProposalNotice />
              </div>

              {/* ── Desktop action row ── */}
              <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 pt-2">
                <Link
                  href={`/${agentCode}/travel-insurance/plans`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[var(--subtle)]"
                >
                  <span className="lg:hidden">← Change plan</span>
                  <span className="max-lg:hidden">← Back to plans</span>
                </Link>
                <button
                  type="submit"
                  disabled={submitting || anyScanning}
                  aria-haspopup="dialog"
                  className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 text-base font-semibold disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="size-4 animate-spin" aria-hidden /> Generating…</>
                  ) : anyScanning ? (
                    <><Loader2 className="size-4 animate-spin" aria-hidden /> Scanning ID…</>
                  ) : (
                    'Review application →'
                  )}
                </button>
              </div>

              {/* ── Mobile: Back to plans text link ── */}
              <div className="sm:hidden text-center pt-2">
                <Link
                  href={`/${agentCode}/travel-insurance/plans`}
                  className="inline-flex min-h-11 items-center text-sm text-[var(--primary)] underline underline-offset-4 dark:text-[#d0e3c8]"
                >
                  ← Back to plans
                </Link>
              </div>
            </form>
          </div>

          {/* ── Right: sticky summary rail — desktop only (spec C) ── */}
          <aside
            className="quote-summary-rail travel-applicant-card travel-selected-plan hidden lg:block"
            aria-labelledby="selected-plan-title"
          >
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
                className="my-4 max-h-16 w-36 object-contain object-left"
              />
            )}
            <p className="text-sm text-[var(--text-muted)]">{insurer}</p>
            <h2 id="selected-plan-title" className="mt-1.5 text-base font-semibold">
              {planName}
            </h2>
            <Link
              href={`/${agentCode}/travel-insurance/plans`}
              className="mt-2 inline-block text-sm text-[var(--primary)] underline underline-offset-4 dark:text-[#d0e3c8]"
            >
              Change plan
            </Link>

            <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Base plan × {total}</dt>
                <dd>PHP {money(basePremium)}</dd>
              </div>
              {chosenAddons.map((a) => (
                <div key={a.code} className="flex justify-between gap-4">
                  <dt className="text-[var(--text-muted)]">{a.name}</dt>
                  <dd className="shrink-0">Added</dd>
                </div>
              ))}
              {!chosenAddons.length && (
                <div className="flex justify-between gap-4 text-[var(--text-muted)]">
                  <dt>Add-ons</dt>
                  <dd>None selected</dd>
                </div>
              )}
            </dl>

            <div
              className="mt-5 border-t border-[var(--border)] pt-4"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-sm text-[var(--text-muted)]">Total premium</p>
              <p className="mt-1 text-3xl font-semibold">PHP {money(basePremium)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                For {plural(total, 'traveller')}
              </p>
              {chosenAddons.length > 0 && (
                <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-[var(--text-muted)]">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Add-ons are priced at proposal generation.
                </p>
              )}
            </div>

            {/* ── Notice only — CTA lives in the form action row (spec D) ── */}
            <div className="mt-5">
              <ProposalNotice />
            </div>

            <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
              Premiums and cover are subject to insurer terms and conditions.
            </p>
          </aside>
        </div>
      </div>

      {/* ── Mobile sticky action bar (spec E) ── */}
      <div
        role="region"
        aria-label="Quote action bar"
        className="quote-sticky-bar sm:hidden no-print"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-main)]">PHP {money(basePremium)}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">for {plural(total, 'traveller')}</p>
        </div>
        <button
          type="submit"
          form="traveller-form"
          disabled={submitting || anyScanning}
          aria-haspopup="dialog"
          className="btn-primary flex shrink-0 items-center gap-2 px-5 py-3 text-sm font-semibold"
        >
          {submitting ? (
            <><Loader2 className="size-4 animate-spin" aria-hidden /> Generating…</>
          ) : anyScanning ? (
            <><Loader2 className="size-4 animate-spin" aria-hidden /> Scanning ID…</>
          ) : (
            'Review application →'
          )}
        </button>
      </div>

      <DataSharingDialog open={agreementOpen} onClose={() => setAgreementOpen(false)} />
      <ReviewDialog
        open={reviewOpen}
        onClose={() => !submitting && setReviewOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={submitError}
        trip={{
          route,
          dates: formatTripRange(departure, returning),
          duration: formatDays(days),
          travellers: `${plural(adults, 'adult')} · ${plural(total - adults, 'child').replace('childs', 'children')}`,
          tripType: travelDetails.isAnnualMultiTrip ? 'Annual multi-trip' : 'Single trip',
          planType: titleCase(travelDetails.travelType),
        }}
        travellers={travellers}
        adults={adults}
        insurer={insurer}
        planName={planName}
        addons={chosenAddons.map((a) => a.name)}
      />
    </>
  )
}
