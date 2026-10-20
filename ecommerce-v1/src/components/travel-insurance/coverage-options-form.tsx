'use client'

import { useRouter } from 'next/navigation'
import { ChangeEvent, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { Skeleton } from '@/components/ui/skeleton'
import { PlanCardSkeleton } from '@/components/ui/insurance-shared'
import { PageIntro } from '@/components/travel-insurance/journey-layout'
import { InsurancePlan } from '@/types/plan'
import { TravelInsurancePlan } from './insurance-plan'
import ServerOffline from '../server-offline'
import { Input } from '../ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { LayoutList, Table2, PanelLeftClose, PanelLeft, HeartPulse, ShieldPlus, Globe2, ArrowUpDown, Check, Search, SlidersHorizontal, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toPHP } from '@/utils/fx'
import {
  getCanonicalConfigForBenefit,
  resolveLimitDisplay,
} from '@/utils/travel-benefits-helpers'
import { removeStorage } from '@/utils/remove-session-storage'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { storePlanName } from '@/utils/custom-fields-storage'
import { COMPANIES } from '@/constants/companies'
import { useTravelProviderFilter } from '@/store/travel-provider-filter-store'
import pacificCrossPlansData from '@/constants/pacific-cross-travel-plans.json'
import pacificCrossAsiaPlansData from '@/constants/pacific-cross-travel-plans-asia.json'
import pacificCrossDomesticPlansData from '@/constants/pacific-cross-travel-plans-domestic.json'
import { TierComparisonMatrix } from './tier-comparison-matrix'
import { MobileFilterSheet } from './mobile-filter-sheet'

type SortKey = 'match' | 'lowest' | 'highest' | 'addons' | 'discounts'
type QuickFilter = 'medical' | 'covid' | 'schengen'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'match', label: 'Best match' },
  { value: 'lowest', label: 'Lowest price' },
  { value: 'highest', label: 'Highest coverage' },
  { value: 'addons', label: 'With add-ons' },
  { value: 'discounts', label: 'With discounts' },
]

const chipBase =
  'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-colors'
const chipOn = 'border-primary bg-primary/10 text-primary'
const chipOff = 'border-border bg-card text-foreground'

/** Highest medical-category benefit limit, normalized to PHP. */
function maxMedicalPHP(plan: any): number {
  const benefits = [
    ...(plan.Plan.MainBenefits || []),
    ...(plan.Plan.AddonBenefits || []),
  ]
  return Math.max(
    0,
    ...benefits
      .filter((b: any) => getCanonicalConfigForBenefit(b).label === 'Medical')
      .map((b: any) => {
        const d = resolveLimitDisplay(b)
        return d.kind === 'amount'
          ? toPHP(Number(d.value), plan.Plan.Currency)
          : 0
      })
  )
}

function ServerConnectionIssue() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-destructive dark:text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <h3 className="mb-3 text-xl font-semibold text-foreground dark:text-white">
          Server Connection Issue
        </h3>

        <p className="mb-6 text-muted-foreground">
          We're experiencing technical difficulties. Our team has been notified
          and is working to resolve this issue.
        </p>

        <p className="mt-4 text-xs text-muted-foreground">
          If the problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}

// ─── Sticky Mobile Compare Bar ───────────────────────────────────────────────

function MobileCompareBar({
  count,
  onCompare,
  onClear,
}: {
  count: number
  onCompare: () => void
  onClear: () => void
}) {
  if (count === 0) return null
  return (
    <div
      className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.08)] px-4 flex items-center gap-3"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingTop: '12px',
        minHeight: '56px',
      }}
    >
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear compare selection"
        className="shrink-0 text-sm font-medium text-muted-foreground underline underline-offset-2 min-h-[44px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={onCompare}
        className="flex-1 rounded-full from-primary to-lilac bg-gradient-to-r text-primary-foreground font-semibold text-sm shadow min-h-[44px] transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        Compare ({count})
      </button>
    </div>
  )
}

type CoverageOptionsFormProps = {
  /** Re-run the search (used by the standalone plans page). */
  onRetry?: () => void
  /** Trip summary bar rendered under the page intro; receives lg-only toolbar actions (search, view toggle). */
  summary?: (actions?: React.ReactNode) => React.ReactNode
}

export function CoverageOptionsForm({ onRetry, summary }: CoverageOptionsFormProps = {}) {
  const router = useRouter()
  const {
    isFormModified,
    coverageOption,
    clientRequest,
    travelDetails,
    quoteRefetchCount,
    insurancePlans,
    setClientRequest,
    updateCoverageOption,
    resetForm,
    incrementQuoteRefetchCount,
    resetQuoteRefetchCount,
    setInsurancePlans,
    updateCustomFields,
    resetCoverageOption,
  } = useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()
  const { providerFilter } = useTravelProviderFilter()

  const [hasReachedLimit, setHasReachedLimit] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const debouncedSearchFilter = useDebounce(searchFilter, 300)
  const [sortBy, setSortBy] = useState<SortKey>('match')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>([])
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list')
  const [showFilters, setShowFilters] = useState(true)
  // Mobile filter sheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  // Mobile compare selection + full-screen compare sheet
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set())
  const [compareSheetOpen, setCompareSheetOpen] = useState(false)

  // Plans come directly from the store — set synchronously by the mutation
  const isLoading = !!clientRequest.id && clientRequest.status === 'fetching'
  const isError = clientRequest.status === 'error' && !!clientRequest.id

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }

  const scrollToPlans = () => {
    setTimeout(() => {
      document.getElementById('plan-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const toggleProvider = (code: string) => {
    setSelectedProviders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
    scrollToPlans()
  }

  const toggleCoverage = (coverage: string) => {
    setSelectedCoverages((prev) =>
      prev.includes(coverage) ? prev.filter((c) => c !== coverage) : [...prev, coverage]
    )
    scrollToPlans()
  }

  const toggleQuickFilter = (filter: QuickFilter) => {
    setQuickFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
    scrollToPlans()
  }

  const clearFilters = () => {
    setSearchFilter('')
    setSelectedProviders([])
    setSelectedCoverages([])
    setQuickFilters([])
    setSortBy('match')
  }

  const handleCompareChange = (planKey: string, checked: boolean) => {
    setCompareSet((prev) => {
      const next = new Set(prev)
      if (checked) next.add(planKey)
      else next.delete(planKey)
      return next
    })
  }

  const filtersActive =
    !!debouncedSearchFilter ||
    selectedProviders.length > 0 ||
    selectedCoverages.length > 0 ||
    quickFilters.length > 0 ||
    sortBy === 'addons' ||
    sortBy === 'discounts'

  const allTravelPlans = useMemo(() => {
    // Dynamic plans from WebSocket (Malayan, Oona, etc.)
    const dynamicPlans = insurancePlans?.data.flatMap(({ Plans, ...item }: any) =>
      Plans.map((plan: any) => ({
        ...item,
        Plan: plan,
      }))
    ) || []

    // Static Pacific Cross plans — only show after dynamic plans have loaded (compare-quote was called)
    // Filter based on destination type from travel details
    const pacificPlans = insurancePlans?.data
      ? (() => {
          const coverageArea = travelDetails.travelDetailList?.[0]?.TravelCoverageArea || ''
          const isDomestic = coverageArea === 'DOMESTIC'
          const isApac = coverageArea === 'APAC'

          if (isDomestic) {
            // Domestic destination → only show domestic plans
            return pacificCrossDomesticPlansData.Plans.map((plan: any) => ({
              CarrierCode: pacificCrossDomesticPlansData.CarrierCode,
              IsExternalLink: pacificCrossDomesticPlansData.IsExternalLink,
              RedirectUrl: pacificCrossDomesticPlansData.RedirectUrl,
              Plan: plan,
            }))
          } else if (isApac) {
            // Asia/APAC destination → show world + asia plans
            return [
              ...pacificCrossPlansData.Plans.map((plan: any) => ({
                CarrierCode: pacificCrossPlansData.CarrierCode,
                IsExternalLink: pacificCrossPlansData.IsExternalLink,
                RedirectUrl: pacificCrossPlansData.RedirectUrl,
                Plan: plan,
              })),
              ...pacificCrossAsiaPlansData.Plans.map((plan: any) => ({
                CarrierCode: pacificCrossAsiaPlansData.CarrierCode,
                IsExternalLink: pacificCrossAsiaPlansData.IsExternalLink,
                RedirectUrl: pacificCrossAsiaPlansData.RedirectUrl,
                Plan: plan,
              })),
            ]
          } else {
            // SCHENGEN / WORLD (non-Asia international) → world plans only
            return pacificCrossPlansData.Plans.map((plan: any) => ({
              CarrierCode: pacificCrossPlansData.CarrierCode,
              IsExternalLink: pacificCrossPlansData.IsExternalLink,
              RedirectUrl: pacificCrossPlansData.RedirectUrl,
              Plan: plan,
            }))
          }
        })()
      : []

    const allPlans = [...dynamicPlans, ...pacificPlans]

    if (!allPlans.length) return []

    // Apply provider filter if set (from /travel-insurance/oona, /travel-insurance/pacific-cross, etc.)
    const filteredByProvider = providerFilter
      ? allPlans.filter((plan: any) => plan.CarrierCode === providerFilter)
      : allPlans

    const lowerFilter = debouncedSearchFilter.toLowerCase()

    return filteredByProvider
      .filter(
        (plan: any) =>
          plan.CarrierCode.toLowerCase().includes(lowerFilter) ||
          plan.Plan.CarrierPlanDesc.toLowerCase().includes(lowerFilter)
      )
      .filter((plan: any) =>
        selectedProviders.length === 0 || selectedProviders.includes(plan.CarrierCode)
      )
      .filter((plan: any) => {
        // Filter by selected coverages
        if (selectedCoverages.length === 0) return true
        const allBenefits = [...(plan.Plan.MainBenefits || []), ...(plan.Plan.AddonBenefits || [])]
        const planCoverages = allBenefits.map((b: any) => b.CoverageName || b.SubCoverageName).filter(Boolean)
        return selectedCoverages.some((c) => planCoverages.includes(c))
      })
      .filter((plan: any) => {
        // Mobile quick-filter chips — AND across active chips
        if (quickFilters.length === 0) return true
        const allBenefits = [...(plan.Plan.MainBenefits || []), ...(plan.Plan.AddonBenefits || [])]
        return quickFilters.every((f) => {
          if (f === 'medical') return maxMedicalPHP(plan) >= 1_000_000
          if (f === 'covid')
            return allBenefits.some((b: any) =>
              /covid/i.test(`${b.BenefitDesc} ${b.CoverageName || ''} ${b.SubCoverageName || ''}`)
            )
          if (f === 'schengen')
            return /schengen/i.test(
              `${plan.Plan.CarrierPlanDesc} ${plan.Plan.Zone?.code || ''} ${plan.Plan.Zone?.name || ''}`
            )
          return true
        })
      })
      .filter((plan: any) => {
        // Filter by add-ons: only show plans that actually have AddonBenefits with data
        if (sortBy === 'addons') {
          return plan.Plan.AddonBenefits && plan.Plan.AddonBenefits.length > 0
        }
        // Filter by discounts: only show plans that have a Discount field with a value > 0
        if (sortBy === 'discounts') {
          const discount = Number(plan.Plan.Discount || plan.Plan.DiscountAmount || 0)
          return discount > 0
        }
        return true
      })
      .sort((a: any, b: any) => {
        // 'match' — preserve the order the insurer/API returned
        if (sortBy === 'match') return 0
        if (sortBy === 'lowest') {
          // Premiums may be quoted in USD/EUR — compare on PHP-normalized values
          return (
            toPHP(Number(a.Plan.DuePremium), a.Plan.Currency) -
            toPHP(Number(b.Plan.DuePremium), b.Plan.Currency)
          )
        }
        if (sortBy === 'addons') {
          // Among plans with add-ons, sort by number of distinct add-on
          // groups descending (AddonBenefits is flattened parent + children
          // rows — only parent rows, ParentBenefit === null, are groups).
          const countGroups = (p: any) =>
            (p.Plan.AddonBenefits || []).filter((b: any) => b.ParentBenefit == null).length
          return countGroups(b) - countGroups(a)
        }
        if (sortBy === 'discounts') {
          // Among discounted plans, sort by discount amount descending
          const aDiscount = Number(a.Plan.Discount || a.Plan.DiscountAmount || 0)
          const bDiscount = Number(b.Plan.Discount || b.Plan.DiscountAmount || 0)
          return bDiscount - aDiscount
        }
        // highest coverage — max benefit limit, PHP-normalized per plan currency
        const getMaxSi = (plan: any) => {
          const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
          return Math.max(
            0,
            ...allBenefits.map((b: any) => {
              const d = resolveLimitDisplay(b)
              const raw = d.kind === 'amount' ? Number(d.value) : Number(b.Silimit || 0)
              return toPHP(raw, plan.Currency)
            })
          )
        }
        return getMaxSi(b.Plan) - getMaxSi(a.Plan)
      })
  }, [insurancePlans?.data, debouncedSearchFilter, sortBy, selectedProviders, selectedCoverages, quickFilters, travelDetails.travelDetailList, providerFilter])

  // Get available providers from loaded plans
  const availableProviders = useMemo(() => {
    const dynamicProviders = insurancePlans?.data ? insurancePlans.data.map((d: any) => d.CarrierCode) : []
    // Only include Pacific Cross after dynamic plans have loaded
    const allProviders = insurancePlans?.data ? [...dynamicProviders, pacificCrossPlansData.CarrierCode] : []
    return Array.from(new Set(allProviders)) as string[]
  }, [insurancePlans?.data])

  // Get available coverages from loaded plans
  const availableCoverages = useMemo(() => {
    const coverages = new Set<string>()
    // Dynamic plans
    if (insurancePlans?.data) {
      insurancePlans.data.forEach((provider: any) => {
        provider.Plans.forEach((plan: any) => {
          const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
          allBenefits.forEach((b: any) => {
            const name = b.CoverageName || b.SubCoverageName
            if (name) coverages.add(name)
          })
        })
      })
    }
    // Pacific Cross static plans
    pacificCrossPlansData.Plans.forEach((plan: any) => {
      const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      allBenefits.forEach((b: any) => {
        const name = b.CoverageName || b.SubCoverageName
        if (name) coverages.add(name)
      })
    })
    pacificCrossAsiaPlansData.Plans.forEach((plan: any) => {
      const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      allBenefits.forEach((b: any) => {
        const name = b.CoverageName || b.SubCoverageName
        if (name) coverages.add(name)
      })
    })
    pacificCrossDomesticPlansData.Plans.forEach((plan: any) => {
      const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
      allBenefits.forEach((b: any) => {
        const name = b.CoverageName || b.SubCoverageName
        if (name) coverages.add(name)
      })
    })
    return Array.from(coverages).sort()
  }, [insurancePlans?.data])

  const activeSheetFilters = selectedProviders.length + selectedCoverages.length

  const lowestPriceIndex =
    allTravelPlans.length > 1
      ? allTravelPlans.reduce(
          (best: number, item: any, i: number) =>
            toPHP(Number(item.Plan.DuePremium), item.Plan.Currency) <
            toPHP(Number(allTravelPlans[best].Plan.DuePremium), allTravelPlans[best].Plan.Currency)
              ? i
              : best,
          0
        )
      : -1

  const handleSelectPlan = (plan: InsurancePlan, carrierCode: string) => {
    if (!travelDetails.agreedToTerms) {
      alert('Please agree to the terms and conditions before proceeding.')
      return
    }
    
    const customFields = {
      PlanName: plan.CarrierPlanDesc,
    }
    
    storePlanName(plan.CarrierPlanDesc)
    updateCustomFields(customFields)

    // Keep only add-on selections whose group code exists on the newly
    // selected plan — switching insurers clears them; switching between
    // plans that share the same add-on groups keeps them.
    const newPlanAddonCodes = new Set(
      (plan.AddonBenefits ?? [])
        .filter((b) => b.ParentBenefit == null && b.BenefitCode != null)
        .map((b) => b.BenefitCode)
    )
    updateCoverageOption({
      selectedPlan: plan,
      carrierCode,
      selectedAddonBenefits: (coverageOption.selectedAddonBenefits ?? []).filter(
        (code) => newPlanAddonCodes.has(code)
      ),
    })

    router.push(`/${agentCode}/products/travel-insurance/avail`)
  }

  const handleRefetch = () => {
    if (onRetry) {
      onRetry()
      return
    }
    if (hasReachedLimit) return

    incrementQuoteRefetchCount()

    if (quoteRefetchCount >= 5) {
      setHasReachedLimit(true)
      resetForm()
      removeStorage('travel-insurance-form')
    }
  }

  if (hasReachedLimit || quoteRefetchCount > 3) {
    return <ServerConnectionIssue />
  }

  // Don't show anything if no search has been performed yet
  if (!clientRequest.id) {
    return null
  }

  if (isError) {
    const errorMessage = clientRequest.errorMessage || ''
    const isAuthError = errorMessage.toLowerCase().includes('agent') ||
      errorMessage.toLowerCase().includes('authorized') ||
      errorMessage.toLowerCase().includes('lob') ||
      errorMessage.toLowerCase().includes('slug') ||
      errorMessage.toLowerCase().includes('validation')

    if (isAuthError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <svg className="h-7 w-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-orange-800">This Insurance is Currently Unavailable</h3>
            <p className="mb-4 text-sm text-orange-700">
              We're sorry, but travel insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent.
            </p>
            <p className="text-xs text-orange-600">
              Please contact your agent or reach out to our support team for assistance.
            </p>
          </div>
        </div>
      )
    }

    return <ServerOffline onRefresh={handleRefetch} />
  }

  const isPlansFetching = (isLoading || !insurancePlans?.data?.[0]?.Plans || (providerFilter && allTravelPlans.length === 0)) && !!clientRequest.id && !isError
  const hasPlans = insurancePlans?.data && insurancePlans.data.length > 0

  return (
    <div className="relative w-full border-0">
      {/* Overlay when form is modified */}
      {isFormModified && (
        <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/60 pt-8 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4">
              <h3 className="mb-2 text-xl font-semibold text-foreground dark:text-white">
                Update Your Search
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                You've made changes to your travel details. Please click the{' '}
                <span className="text-primary font-semibold">Search</span>{' '}
                button to update your coverage options with the latest
                information.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => {
                  const travelForm =
                    document.querySelector(
                      '[data-testid="travel-details-form"]'
                    ) || document.querySelector('form')
                  const searchButton = travelForm?.querySelector(
                    'button[type="submit"]'
                  ) as HTMLButtonElement
                  if (searchButton) {
                    searchButton.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                    setTimeout(() => searchButton.focus(), 500)
                  }
                }}
                className="bg-primary hover:bg-primary/90 focus:ring-primary rounded-full px-6 py-3 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Go to Search Button
              </button>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-full border border-border bg-white px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-muted-foreground dark:hover:bg-gray-700"
              >
                Scroll to Top
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-4 max-sm:pt-4 max-sm:pb-2 sm:gap-6">
          {isPlansFetching ? (
            <>
              <PageIntro
                title="Choose your travel plan"
                helper="Searching for the best plans for you…"
              />
              {summary?.()}
            </>
          ) : (
            <>
              <PageIntro
                title="Choose your travel plan"
                helper={
                  allTravelPlans.length > 0
                    ? `${allTravelPlans.length} ${allTravelPlans.length === 1 ? 'plan matches' : 'plans match'} your trip`
                    : undefined
                }
              />
              {summary?.(
                <>
                {!showFilters && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(true)}
                    aria-label="Show filters"
                    title="Show filters"
                    className="border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors"
                  >
                    <PanelLeft className="size-4" aria-hidden />
                  </button>
                )}
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    className="h-9 w-full bg-card pl-9"
                    placeholder="Search plans…"
                    aria-label="Search plans"
                    value={searchFilter}
                    onChange={handleSearchInputChange}
                  />
                </div>
                <div className="inline-flex shrink-0 rounded-full border border-border/60 bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                      viewMode === 'list'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LayoutList className="size-3.5" aria-hidden />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('compare')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                      viewMode === 'compare'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Table2 className="size-3.5" aria-hidden />
                    Compare
                  </button>
                </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl overflow-x-clip">
        {isPlansFetching ? (
          <div className="relative flex min-h-[60vh] w-full max-w-full gap-6 overflow-hidden px-4 pb-6 sm:px-6">
            {/* Sidebar skeleton — collapsible on desktop */}
            <aside
              className={cn(
                'hidden shrink-0 lg:block transition-all duration-300 ease-in-out',
                showFilters ? 'w-[200px] opacity-100' : 'w-0 overflow-hidden opacity-0 pointer-events-none'
              )}
            >
              <div className="sticky top-4 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-22" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-30" />
                  <Skeleton className="h-3 w-26" />
                </div>
              </div>
            </aside>
            {/* Plan cards skeleton */}
            <div className="flex flex-1 flex-col gap-4">
              <Skeleton className="h-4 w-56" />
              {Array.from({ length: 3 }).map((_, i) => (
                <PlanCardSkeleton key={i} />
              ))}
              <p className="text-muted-foreground text-center text-sm">
                Searching for the best plans for you...
              </p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted dark:bg-gray-800">
                  <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground dark:text-white">No Plans Available</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                No travel insurance plans are available for your selected dates and destination. Please try different travel details or contact your agent for assistance.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="rounded-full bg-muted px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted dark:bg-gray-800 dark:text-muted-foreground dark:hover:bg-gray-700"
              >
                Edit search
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-[60vh] w-full max-w-full gap-0 pb-6">
            {/*
              ── Sidebar filter panel (desktop only) ──────────────────────────
              Two states:
              • Expanded  (showFilters=true):  240px wide, full content visible
              • Collapsed (showFilters=false): 40px icon-rail, toggle button only
              A smooth width transition avoids layout jump; content fades with opacity.
              The rail always occupies space so the toggle affordance never disappears.
            */}
            <aside
              className={cn(
                'hidden lg:flex flex-col shrink-0 self-start transition-[width] duration-300 ease-in-out overflow-hidden',
                showFilters ? 'ml-6 w-[260px] rounded-xl border border-border bg-card p-4' : 'w-0'
              )}
            >
              {/* ── Header row ── */}
              <div className="flex items-center justify-between pr-2 border-b border-border/40 pb-3 mb-4 min-w-[220px]">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  aria-label="Collapse filters"
                  title="Collapse filters"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              {/* ── Filter content ── */}
              <div className="flex-1 overflow-hidden min-w-[220px]">
                <div className="sticky top-4 space-y-5 pr-4">
                  {/* Sort */}
                  <div>
                    <h4 className="text-foreground mb-2 text-xs font-bold uppercase tracking-wide">Sort by</h4>
                    <ul className="space-y-1">
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.value}>
                          <button
                            type="button"
                            onClick={() => { setSortBy(opt.value); scrollToPlans() }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors text-left',
                              sortBy === opt.value
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <span className={cn(
                              'h-2 w-2 shrink-0 rounded-full border transition-colors',
                              sortBy === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground/50 bg-card'
                            )} />
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Providers */}
                  {!providerFilter && (
                    <div>
                      <h4 className="text-foreground mb-2 text-xs font-bold uppercase tracking-wide">Providers</h4>
                      <ul className="space-y-1">
                        {availableProviders.map((code: string) => {
                          const company = COMPANIES.find((c) => c.carrierCode === code)
                          const isActive = selectedProviders.includes(code)
                          return (
                            <li key={code}>
                              <button
                                type="button"
                                onClick={() => toggleProvider(code)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors text-left',
                                  isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                              >
                                <span className={cn(
                                  'h-2 w-2 shrink-0 rounded-full border transition-colors',
                                  isActive ? 'border-primary bg-primary' : 'border-muted-foreground/50 bg-card'
                                )} />
                                {company?.companyName || code}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Coverages */}
                  <div>
                    <h4 className="text-foreground mb-2 text-xs font-bold uppercase tracking-wide">Coverages</h4>
                    <ul className="space-y-1">
                      {availableCoverages.map((coverage: string) => {
                        const isActive = selectedCoverages.includes(coverage)
                        const label = coverage
                          .split(' ')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                          .join(' ')
                        return (
                          <li key={coverage}>
                            <button
                              type="button"
                              onClick={() => toggleCoverage(coverage)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] transition-colors text-left',
                                isActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <span className={cn(
                                'h-2 w-2 shrink-0 rounded-full transition-colors',
                                isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                              )} />
                              {label}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Plan list ── */}
            <div
              id="plan-list"
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-4 overflow-x-clip px-4 sm:gap-3 sm:px-6',
                showFilters ? 'lg:pl-5' : 'lg:pl-6'
              )}
            >
              {/* h2 anchors the h3 plan names — keeps heading order valid */}
              <h2 className="sr-only">Available plans</h2>
              {/* Toolbar: mobile/tablet search (desktop search lives in the summary card) */}
              <div className="flex items-center gap-2 lg:hidden">
                {/* Mobile search — full width, visible only on small screens */}
                <div className="relative flex lg:hidden flex-1 min-w-0">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    className="border-border h-11 w-full bg-card pl-10 shadow-none"
                    placeholder="Search plans…"
                    aria-label="Search plans"
                    value={searchFilter}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </div>

              {/* Mobile-only: Filters / Sort / quick-filter chips (scrolls with content) */}
              <div className="relative -mx-4 sm:hidden">
                <div
                  className="scrollbar-none flex snap-x snap-proximity scroll-px-4 gap-2 overflow-x-auto px-4 pr-10"
                  role="group"
                  aria-label="Plan filters"
                >
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setFilterSheetOpen(true)}
                    className={cn(
                      chipBase,
                      'snap-start',
                      activeSheetFilters > 0 ? chipOn : chipOff
                    )}
                  >
                    <SlidersHorizontal className="size-3.5" aria-hidden />
                    Filters{activeSheetFilters > 0 && ` (${activeSheetFilters})`}
                  </button>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                    <SelectTrigger
                      aria-label="Sort plans"
                      className={cn(chipBase, chipOff, 'h-10 w-auto snap-start gap-1.5 py-0')}
                    >
                      <ArrowUpDown className="size-3.5 shrink-0" aria-hidden />
                      <span>
                        Sort: <SelectValue placeholder="Sort" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(
                    [
                      { key: 'medical' as QuickFilter, label: 'Medical ₱1M+', icon: HeartPulse },
                      { key: 'covid' as QuickFilter, label: 'COVID cover', icon: ShieldPlus },
                      { key: 'schengen' as QuickFilter, label: 'Schengen', icon: Globe2 },
                    ] as const
                  ).map((chip) => {
                    const isActive = quickFilters.includes(chip.key)
                    const Icon = isActive ? Check : chip.icon
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => toggleQuickFilter(chip.key)}
                        className={cn(chipBase, 'snap-start', isActive ? chipOn : chipOff)}
                      >
                        <Icon className="size-3.5" aria-hidden />
                        {chip.label}
                      </button>
                    )
                  })}
                </div>
                <div
                  aria-hidden
                  className="from-section pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l to-transparent"
                />
              </div>

              {/* Filtered-out empty state — plans exist but none match */}
              {allTravelPlans.length === 0 && (
                <div className="border-border bg-card flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center">
                  <h3 className="text-foreground text-base font-bold">
                    No plans match your filters
                  </h3>
                  <p className="text-muted-foreground max-w-xs text-sm">
                    Try removing a filter or searching for something else.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="border-border bg-muted text-foreground hover:bg-muted/70 focus-visible:ring-ring inline-flex min-h-11 items-center rounded-full border px-6 text-sm font-medium outline-none focus-visible:ring-2"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {viewMode === 'list' ? (
                <div className="flex flex-col gap-2">
                  {allTravelPlans.map((item: any, index: number) => {
                    const planKey = `${item.CarrierCode}-${item.Plan.CarrierPlanCode || item.Plan.CarrierPlanDesc}-${index}`
                    return (
                      <TravelInsurancePlan
                        key={planKey}
                        plan={item.Plan}
                        carrierCode={item.CarrierCode}
                        selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                        isAvailable={!isFormModified}
                        redirectUrl={item.IsExternalLink === 'Y' ? item.RedirectUrl : undefined}
                        currency={item.Plan.Currency}
                        badge={index === lowestPriceIndex ? 'Lowest price' : undefined}
                        compareChecked={compareSet.has(planKey)}
                        onCompareChange={(checked) => handleCompareChange(planKey, checked)}
                        onSelectPlan={(plan, carrierCode) => {
                          handleSelectPlan(plan, carrierCode)
                          resetQuoteRefetchCount()
                        }}
                      />
                    )
                  })}
                </div>
              ) : (
                <>
                  {/* Compare matrix — desktop only, isolated scroll */}
                  <div className="hidden lg:block w-full max-w-full overflow-hidden">
                    <TierComparisonMatrix
                      plans={allTravelPlans}
                      selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                      isAvailable={!isFormModified}
                      onSelectPlan={(plan, carrierCode) => {
                        handleSelectPlan(plan, carrierCode)
                        resetQuoteRefetchCount()
                      }}
                    />
                  </div>
                  {/* Mobile fallback when Compare is active — still show List */}
                  <div className="flex flex-col gap-2 lg:hidden">
                    {allTravelPlans.map((item: any, index: number) => {
                      const planKey = `${item.CarrierCode}-${item.Plan.CarrierPlanCode || item.Plan.CarrierPlanDesc}-${index}`
                      return (
                        <TravelInsurancePlan
                          key={planKey}
                          plan={item.Plan}
                          carrierCode={item.CarrierCode}
                          selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                          isAvailable={!isFormModified}
                          redirectUrl={item.IsExternalLink === 'Y' ? item.RedirectUrl : undefined}
                          currency={item.Plan.Currency}
                          badge={index === lowestPriceIndex ? 'Lowest price' : undefined}
                          compareChecked={compareSet.has(planKey)}
                          onCompareChange={(checked) => handleCompareChange(planKey, checked)}
                          onSelectPlan={(plan, carrierCode) => {
                            handleSelectPlan(plan, carrierCode)
                            resetQuoteRefetchCount()
                          }}
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Filter Sheet ── */}
      <MobileFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortBy={sortBy}
        onSortChange={(v) => { setSortBy(v as SortKey); scrollToPlans() }}
        availableProviders={availableProviders}
        selectedProviders={selectedProviders}
        onProviderToggle={toggleProvider}
        hideProviderFilter={!!providerFilter}
        availableCoverages={availableCoverages}
        selectedCoverages={selectedCoverages}
        onCoverageToggle={toggleCoverage}
        planCount={allTravelPlans.length}
        onClearAll={clearFilters}
      />

      {/* ── Mobile Compare Bar (sticky bottom) ── */}
      <MobileCompareBar
        count={compareSet.size}
        onCompare={() => setCompareSheetOpen(true)}
        onClear={() => setCompareSet(new Set())}
      />

      {/* ── Mobile Compare Sheet (full-screen overlay) ── */}
      {compareSheetOpen && (() => {
        const selectedPlans = allTravelPlans.filter((_item: any, index: number) => {
          const planKey = `${_item.CarrierCode}-${_item.Plan.CarrierPlanCode || _item.Plan.CarrierPlanDesc}-${index}`
          return compareSet.has(planKey)
        })
        return (
          <div
            className="sm:hidden fixed inset-0 z-50 flex flex-col bg-background"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Compare plans"
          >
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shrink-0">
              <button
                type="button"
                onClick={() => setCompareSheetOpen(false)}
                aria-label="Close compare"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              >
                <X className="size-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">Compare plans</h2>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">
                  {selectedPlans.length} {selectedPlans.length === 1 ? 'plan' : 'plans'} selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setCompareSet(new Set()); setCompareSheetOpen(false) }}
                className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring px-1 min-h-[44px]"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-auto overscroll-contain p-4">
              {selectedPlans.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                  <p className="text-muted-foreground text-sm">
                    Select at least 2 plans using the checkboxes, then tap Compare.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCompareSheetOpen(false)}
                    className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Back to plans
                  </button>
                </div>
              ) : (
                <TierComparisonMatrix
                  plans={selectedPlans}
                  selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                  isAvailable={!isFormModified}
                  onSelectPlan={(plan, carrierCode) => {
                    handleSelectPlan(plan, carrierCode)
                    resetQuoteRefetchCount()
                    setCompareSheetOpen(false)
                  }}
                />
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
