'use client'

import { useState, useMemo, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { useTravelCompare } from '@/hooks/use-travel-compare'
import { travelInsuranceSchemaToInitCompareQuote } from '@/utils/mappers/travel-insurance/init-compare-quote'
import { InsurancePlan } from '@/types/plan'
import pacificCrossPlansData from '@/constants/pacific-cross-travel-plans.json'
import pacificCrossAsiaPlansData from '@/constants/pacific-cross-travel-plans-asia.json'
import pacificCrossDomesticPlansData from '@/constants/pacific-cross-travel-plans-domestic.json'
import { CARRIER_BRAND_COLORS, COMPANIES } from '@/constants/companies'
import { toPHP } from '@/utils/fx'
import { PlanFilterSidebar, PLAN_SORT_OPTIONS, type PlanSortKey } from '@/components/travel-insurance/plan-filter-sidebar'
import { PlanFilterSheet } from '@/components/travel-insurance/plan-filter-sheet'
import { ModifySearchModal } from '@/components/travel-insurance/modify-search-modal'
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  AlertCircle,
  Stethoscope,
  Ambulance,
  Luggage,
  Plane,
  ShieldCheck,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react'
import { KeyConditions } from '@/components/travel-insurance/key-conditions'
import { PlanCardSkeleton } from '@/components/travel-insurance/plan-card-skeleton'
import { TripSummary } from '@/components/travel-insurance/travel-sticky-bar'
import {
  CompareGrid,
  CompareSheet,
  MAX_COMPARE,
  MobileCompareBar,
} from '@/components/travel-insurance/plan-compare'
import {
  formatBenefitLimit,
  getHighlightBenefits,
  groupBenefits,
  getKeyBenefits,
  normalizeStaticPlan,
} from '@/utils/travel-benefits'

const BENEFIT_ICONS: [RegExp, LucideIcon][] = [
  [/evacuat|repatriat|ambulance/i, Ambulance],
  [/hospital/i, Stethoscope],
  [/medical|illness|emergency/i, HeartPulse],
  [/baggage|luggage/i, Luggage],
  [/delay|cancel|flight|trip|travel/i, Plane],
  [/accident|death|disab/i, ShieldCheck],
]
const benefitIcon = (label: string): LucideIcon =>
  BENEFIT_ICONS.find(([re]) => re.test(label))?.[1] ?? ShieldCheck

const CARD_LOGO_SIZE: Record<string, { width: number; height: number }> = {
  MALAYAN: { width: 900, height: 211 },
  OONAPH: { width: 900, height: 341 },
  PACIFIC: { width: 900, height: 900 },
}

type StaticPlanSource = {
  CarrierCode: string
  IsExternalLink: string
  RedirectUrl: string
  Plans: unknown[]
}

const staticPlansFor = (area: string): StaticPlanSource[] => {
  if (area === 'DOMESTIC') return [pacificCrossDomesticPlansData]
  if (area === 'APAC') return [pacificCrossPlansData, pacificCrossAsiaPlansData]
  return [pacificCrossPlansData]
}

const money = (n: number) =>
  n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Step2ChoosePlanPage() {
  const router = useRouter()
  const params = useParams()
  const agentCode = (params['agent-code'] as string) || 'ckO6uNx2O6'

  const {
    travelDetails,
    insurancePlans,
    setInsurancePlans,
    setClientRequest,
    updateCoverageOption,
    setStep,
  } = useTravelInsuranceStore()

  const { compare, status, cards, clientRequestId, error: compareError } = useTravelCompare()
  const started = useRef(false)

  // Hydration guard + session guard
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const landingPath = `/${agentCode}/travel-insurance`

  const [modifyOpen, setModifyOpen] = useState(false)

  const runCompare = useCallback(() => {
    try {
      const details = useTravelInsuranceStore.getState().travelDetails
      compare(travelInsuranceSchemaToInitCompareQuote(details, agentCode))
    } catch (err) {
      console.error('Failed to initialize compare quote:', err)
    }
  }, [agentCode, compare])

  useEffect(() => {
    if (!hydrated || started.current) return
    started.current = true

    if (!useTravelInsuranceStore.getState().travelDetails.travelDetailList?.[0]?.TravelCountry) {
      router.replace(landingPath)
      return
    }
    window.scrollTo(0, 0)
    runCompare()
  }, [hydrated, router, landingPath, runCompare])

  const handleModified = () => {
    setModifyOpen(false)
    clearFilters()
    setExpandedPlanId(null)
    setCompareIds([])
    window.scrollTo(0, 0)
    runCompare()
  }

  // Sync API response into store
  useEffect(() => {
    if (status === 'ready' && cards) {
      setInsurancePlans(cards)
      setClientRequest({
        id: clientRequestId ?? 'ready',
        status: 'success',
      })
    } else if (status === 'error') {
      setClientRequest({
        id: clientRequestId ?? 'error',
        status: 'error',
        errorMessage: compareError?.message || 'Unable to load travel insurance plans.',
      })
    }
  }, [status, cards, clientRequestId, compareError, setInsurancePlans, setClientRequest])

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<PlanSortKey>('match')
  const [showFilters, setShowFilters] = useState(true)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const closeFilterSheet = useCallback(() => setFilterSheetOpen(false), [setFilterSheetOpen])
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))
  const clearFilters = () => {
    setSelectedProviders([])
    setSelectedCoverages([])
    setSearchQuery('')
    setSortBy('match')
  }
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareSheetOpen, setCompareSheetOpen] = useState(false)
  const closeCompareSheet = useCallback(() => setCompareSheetOpen(false), [])
  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, id]
    )

  const isLoading = status === 'idle' || status === 'loading'

  const availablePlans = useMemo(() => {
    if (status !== 'ready') return []
    const area = travelDetails.travelDetailList?.[0]?.TravelCoverageArea || ''
    const sources = [
      ...(insurancePlans?.data ?? []).flatMap((group) =>
        (group.Plans || []).map((plan) => ({
          carrierCode: group.CarrierCode || plan.InsurerCode || plan.CarrierProductCode || 'INSURER',
          redirectUrl: undefined as string | undefined,
          plan,
        }))
      ),
      ...staticPlansFor(area).flatMap((src) =>
        src.Plans.map((raw) => ({
          carrierCode: src.CarrierCode,
          redirectUrl: src.IsExternalLink === 'Y' ? src.RedirectUrl : undefined,
          plan: normalizeStaticPlan(raw as InsurancePlan),
        }))
      ),
    ]
    return sources.map(({ carrierCode, redirectUrl, plan }, index) => {
      const keyBenefits = getKeyBenefits(plan)
      const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
      const brand = CARRIER_BRAND_COLORS[carrierCode]
      const currency = plan.Currency || 'PHP'
      const premium = Number(plan.DuePremium || plan.GrossPremium || plan.BeforeVatPremium) || 0
      return {
        id: `${carrierCode}-${plan.CarrierPlanCode ?? index}-${index}`,
        carrierCode,
        carrierName: provider?.companyName || plan.CarrierProductName || carrierCode,
        planCode: plan.CarrierPlanCode,
        planName: plan.CarrierPlanDesc.trim(),
        sumInsured: toPHP(Number(plan.SumInsured) || 0, currency),
        medicalLimit: formatBenefitLimit(keyBenefits.medical),
        duePremium: toPHP(premium, currency),
        currency: 'PHP',
        logoUrl: brand?.cardLogoTight || brand?.planCardLogo || provider?.image || plan.LogoUrl,
        logoSize: (brand?.cardLogoTight && CARD_LOGO_SIZE[carrierCode]) || { width: 400, height: 128 },
        redirectUrl,
        highlights: getHighlightBenefits(plan, 6),
        groups: groupBenefits(plan),
        benefitCount: plan.MainBenefits?.length ?? 0,
        rawPlan: plan,
      }
    })
  }, [status, insurancePlans, travelDetails.travelDetailList])

  const providers = useMemo(() => {
    const seen = new Set<string>()
    return availablePlans
      .filter((p) => !seen.has(p.carrierCode) && seen.add(p.carrierCode))
      .map((p) => ({ code: p.carrierCode, name: p.carrierName }))
  }, [availablePlans])

  const planCoverageNames = (plan: InsurancePlan) =>
    [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      .map((b) => b.CoverageName || b.SubCoverageName)
      .filter((n): n is string => Boolean(n))

  const coverages = useMemo(
    () => Array.from(new Set(availablePlans.flatMap((p) => planCoverageNames(p.rawPlan)))).sort(),
    [availablePlans]
  )

  const addonGroups = (plan: InsurancePlan) =>
    (plan.AddonBenefits || []).filter((b) => b.ParentBenefit == null).length

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return availablePlans
      .filter((plan) => {
        if (selectedProviders.length && !selectedProviders.includes(plan.carrierCode)) return false
        if (selectedCoverages.length) {
          const names = planCoverageNames(plan.rawPlan)
          if (!selectedCoverages.some((c) => names.includes(c))) return false
        }
        if (sortBy === 'addons' && !plan.rawPlan.AddonBenefits?.length) return false
        if (sortBy === 'discounts' && !(Number(plan.rawPlan.DiscountAmount || 0) > 0)) return false
        return !q || plan.planName.toLowerCase().includes(q) || plan.carrierName.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortBy === 'lowest') return a.duePremium - b.duePremium
        if (sortBy === 'highest') return b.sumInsured - a.sumInsured
        if (sortBy === 'addons') return addonGroups(b.rawPlan) - addonGroups(a.rawPlan)
        if (sortBy === 'discounts')
          return Number(b.rawPlan.DiscountAmount || 0) - Number(a.rawPlan.DiscountAmount || 0)
        return 0
      })
  }, [availablePlans, selectedProviders, selectedCoverages, searchQuery, sortBy])

  const comparedPlans = useMemo(
    () =>
      compareIds
        .map((id) => availablePlans.find((p) => p.id === id))
        .filter((p): p is (typeof availablePlans)[number] => Boolean(p)),
    [compareIds, availablePlans]
  )

  const activeFilterCount =
    selectedProviders.length + selectedCoverages.length + (sortBy !== 'match' ? 1 : 0)

  const totalTravellers =
    (travelDetails.noOfAdults || 1) + (travelDetails.noOfChildren || 0)

  const handleSelectPlan = (plan: (typeof availablePlans)[0]) => {
    if (plan.redirectUrl) {
      window.open(plan.redirectUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setCompareSheetOpen(false)
    updateCoverageOption({
      carrierCode: plan.carrierCode,
      selectedPlan: plan.rawPlan,
      selectedAddonBenefits: [],
    })
    setStep(3)
    router.push(`/${agentCode}/travel-insurance/quote`)
  }

  const chooseById = (id: string) => {
    const plan = availablePlans.find((p) => p.id === id)
    if (plan) handleSelectPlan(plan)
  }

  if (!hydrated) {
    return (
      <>
        <Header agentCode={agentCode} currentStep={2} />
        <div className="w-full mx-auto max-w-7xl px-4 py-4 pb-32 sm:px-6 sm:py-8 lg:px-8">
          <div className="hidden sm:block mb-8 h-14 w-full animate-pulse rounded-lg bg-[#dfe7df] dark:bg-[#3d4140]" />
          <div className="w-full grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="hidden lg:block h-80 animate-pulse rounded-lg bg-[#dfe7df] dark:bg-[#3d4140]" />
            <div className="w-full space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:hidden">
                <div className="h-11 w-24 shrink-0 animate-pulse rounded-md bg-[#dfe7df] dark:bg-[#3d4140]" />
                <div className="h-11 flex-1 animate-pulse rounded-md bg-[#dfe7df] dark:bg-[#3d4140]" />
              </div>
              <div className="h-11 sm:h-12 w-full animate-pulse rounded-lg bg-[#dfe7df] dark:bg-[#3d4140]" />
              <div className="travel-plan-list w-full">
                {[...Array(3)].map((_, i) => (
                  <PlanCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const hasError = status === 'error'
  const hasPlans = filteredPlans.length > 0

  return (
    <>
      <Header agentCode={agentCode} currentStep={2} onEditTrip={() => setModifyOpen(true)} />

      <div className="w-full mx-auto max-w-7xl px-4 py-4 pb-32 sm:px-6 sm:py-8 lg:px-8">
        {/* Page Heading */}
        <div className="max-sm:sr-only">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
            Travel insurance · Step 2 of 5
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find the cover for your journey.
          </h1>
          <p className="mt-3 text-base leading-7 text-[#333333] dark:text-[#c4c7c5]">
            Compare the details that matter, then choose a plan for your trip.
          </p>
          <p className="mt-1 text-sm text-[#808080] dark:text-[#b2b7b4]" role="status">
            {isLoading
              ? 'Fetching real-time plans from partner insurers…'
              : `${filteredPlans.length} ${filteredPlans.length === 1 ? 'plan matches' : 'plans match'} your trip.`}
          </p>
        </div>

        <TripSummary onEdit={() => setModifyOpen(true)} hideFloatingBelowLg={compareIds.length > 0} />

        <div
          className={`w-full grid grid-cols-1 gap-8 ${showFilters ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}
        >
          {showFilters && (
            <div className="contents max-sm:hidden">
            <PlanFilterSidebar
              sortBy={sortBy}
              onSortChange={setSortBy}
              providers={providers}
              selectedProviders={selectedProviders}
              onToggleProvider={toggleIn(setSelectedProviders)}
              coverages={coverages}
              selectedCoverages={selectedCoverages}
              onToggleCoverage={toggleIn(setSelectedCoverages)}
              onClear={clearFilters}
              onCollapse={() => setShowFilters(false)}
            />
            </div>
          )}

          {/* Results Column */}
          <div className="w-full min-w-0 space-y-4">
            <div className="flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setFilterSheetOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-[#c7d4c9] px-3 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:border-[#565c58] dark:text-[#d0e3c8] dark:hover:bg-[#303232]"
              >
                <Filter className="size-4" aria-hidden />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    aria-label={`${activeFilterCount} active`}
                    className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#006838] px-1.5 text-xs font-bold leading-5 text-white"
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label className="relative min-w-0 flex-1">
                <ArrowUpDown
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#006838] dark:text-[#d0e3c8]"
                  aria-hidden
                />
                <select
                  aria-label="Sort plans"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as PlanSortKey)}
                  className="min-h-11 w-full appearance-none truncate rounded-md border border-[#c7d4c9] bg-white pl-9 pr-9 text-sm font-semibold text-[#183d2c] focus-visible:outline-2 focus-visible:outline-[#006838] dark:border-[#565c58] dark:bg-[#262828] dark:text-[#f4f5f2]"
                >
                  {PLAN_SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#808080] dark:text-[#b2b7b4]"
                  aria-hidden
                />
              </label>
              <span className="shrink-0 text-sm font-medium text-[#333333] dark:text-[#c4c7c5]" aria-hidden>
                {isLoading ? '…' : `${filteredPlans.length} ${filteredPlans.length === 1 ? 'plan' : 'plans'}`}
              </span>
            </div>
            {!showFilters && (
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="inline-flex max-sm:hidden min-h-11 items-center gap-2 rounded-md border border-[#c7d4c9] px-3 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] dark:border-[#565c58] dark:text-[#d0e3c8] dark:hover:bg-[#303232]"
              >
                <Filter className="size-4" aria-hidden />
                Show filters
              </button>
            )}
            {/* Search Input Bar */}
            <div className="flex items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <input
                  type="search"
                  placeholder="Search plans by name or feature…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ui-form-field pl-10"
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#808080]" />
              </div>
            </div>

            {compareIds.length > 0 && !isLoading && !hasError && (
              <div className="hidden lg:block">
                <CompareGrid
                  plans={comparedPlans}
                  onRemove={toggleCompare}
                  onChoose={chooseById}
                />
              </div>
            )}

            {/* Skeleton Loading */}
            {isLoading && (
              <div className="travel-plan-list w-full">
                {[...Array(3)].map((_, i) => (
                  <PlanCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
                <AlertCircle className="mx-auto size-8 text-red-600" />
                <h3 className="mt-3 text-base font-semibold text-red-800 dark:text-red-200">
                  Unable to load plans
                </h3>
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                  {compareError?.message || 'Please try again or modify your search.'}
                </p>
                <button
                  type="button"
                  onClick={runCompare}
                  className="btn-primary mt-4"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasError && !hasPlans && (
              <div className="rounded-lg border border-[#dfe7df] bg-white p-12 text-center dark:border-[#3d4140] dark:bg-[#262828]">
                <AlertCircle className="mx-auto size-8 text-[#808080]" />
                <h3 className="mt-3 text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                  No matching plans found
                </h3>
                <p className="mt-1 text-xs text-[#808080] dark:text-[#b2b7b4]">
                  Try adjusting your filters or modify your trip details.
                </p>
                <button
                  type="button"
                  onClick={() => setModifyOpen(true)}
                  className="btn-primary mt-4 inline-flex"
                >
                  Modify Search
                </button>
              </div>
            )}

            {/* Plan Cards List */}
            {!isLoading && !hasError && hasPlans && (
              <div className="travel-plan-list w-full">
                {filteredPlans.map((plan) => {
                  const isExpanded = expandedPlanId === plan.id
                  return (
                    <article
                      key={plan.id}
                      aria-label={plan.planName}
                      className={`travel-plan-card${isExpanded ? ' is-expanded' : ''}`}
                    >
                      <div className="travel-plan-card__summary">
                        <div className="travel-plan-card__info">
                          <p className={`travel-provider-name${plan.logoUrl ? ' max-sm:sr-only' : ''}`}>{plan.carrierName}</p>
                          <label className="travel-compare-choice">
                            <input
                            type="checkbox"
                            aria-label={`Compare ${plan.planName}`}
                            checked={compareIds.includes(plan.id)}
                            disabled={compareIds.length >= MAX_COMPARE && !compareIds.includes(plan.id)}
                            onChange={() => toggleCompare(plan.id)}
                            />
                            <span>Compare</span>
                          </label>
                          <h2 className="travel-plan-title">{plan.planName}</h2>
                          <div className="travel-plan-benefits">
                            {plan.highlights.map((b, i) => {
                              const Icon = benefitIcon(b.label)
                              return (
                                <div key={i} className="travel-plan-benefit">
                                  <Icon aria-hidden />
                                  <div>
                                    <p className="font-semibold">{b.value}</p>
                                    <p className="travel-plan-benefit__label">{b.label}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="travel-plan-price">
                          {plan.logoUrl && (
                            <div className="travel-insurer-logo">
                              <Image
                                src={plan.logoUrl}
                                alt={plan.carrierName}
                                width={plan.logoSize.width}
                                height={plan.logoSize.height}
                                unoptimized
                              />
                            </div>
                          )}
                          <p>
                            <span className="travel-plan-price__currency">{plan.currency}</span>{' '}
                            <strong>{money(plan.duePremium)}</strong>
                          </p>
                          <span className="travel-plan-total">
                            Total for {totalTravellers} {totalTravellers === 1 ? 'traveller' : 'travellers'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectPlan(plan)}
                            className="travel-apply"
                          >
                            Choose this plan <span aria-hidden>→</span>
                          </button>
                          {plan.redirectUrl && (
                            <span className="travel-provider-note">via {plan.carrierName} secure site</span>
                          )}
                        </div>
                      </div>
                      <div className="travel-plan-collapse" aria-hidden={!isExpanded}>
                       <div>
                        <div id={`benefits-${plan.id}`} className="travel-plan-details">
                          <div className="travel-plan-details__columns">
                            {[0, 1].map((col) => (
                              <div key={col}>
                                {plan.groups
                                  .filter((_, gi) => gi % 2 === col)
                                  .map((group) => (
                                    <section key={group.title} className="travel-benefit-group">
                                      <h3>{group.title}</h3>
                                      <dl>
                                        {group.rows.map((row, ri) => (
                                          <div key={ri} className="travel-benefit-row">
                                            <dt>{row.label}</dt>
                                            <dd
                                              className={
                                                ['Included', 'Unlimited'].includes(row.value)
                                                  ? 'travel-benefit-included'
                                                  : undefined
                                              }
                                            >
                                              {row.value}
                                              {row.note && <span className="travel-benefit-note">{row.note}</span>}
                                            </dd>
                                          </div>
                                        ))}
                                      </dl>
                                    </section>
                                  ))}
                              </div>
                            ))}
                          </div>
                          <KeyConditions />
                          <p className="mt-4 text-xs leading-5 text-[#69756e] dark:text-[#b2b7b4]">
                            Refer to the policy wording for full benefits, limits and exclusions.
                          </p>
                        </div>
                       </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`benefits-${plan.id}`}
                        className="travel-benefits-toggle"
                      >
                        <span>
                          {isExpanded ? (
                            'View less'
                          ) : (
                            <>
                              View <span className="sm:hidden">all </span>
                              {plan.benefitCount} benefits
                            </>
                          )}
                        </span>
                        <ChevronDown
                          className={`size-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileCompareBar
        count={compareIds.length}
        onCompare={() => setCompareSheetOpen(true)}
        onClear={() => setCompareIds([])}
      />
      <CompareSheet
        open={compareSheetOpen}
        plans={comparedPlans}
        onClose={closeCompareSheet}
        onClear={() => setCompareIds([])}
        onChoose={chooseById}
      />

      <PlanFilterSheet
        open={filterSheetOpen}
        onClose={closeFilterSheet}
        resultCount={filteredPlans.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
        providers={providers}
        selectedProviders={selectedProviders}
        onToggleProvider={toggleIn(setSelectedProviders)}
        coverages={coverages}
        selectedCoverages={selectedCoverages}
        onToggleCoverage={toggleIn(setSelectedCoverages)}
        onClear={clearFilters}
      />

      <ModifySearchModal
        agentCode={agentCode}
        open={modifyOpen}
        onClose={() => setModifyOpen(false)}
        onSubmitted={handleModified}
      />
    </>
  )
}
