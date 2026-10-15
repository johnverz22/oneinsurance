'use client'

import { useRouter } from 'next/navigation'
import { ChangeEvent, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { Skeleton } from '@/components/ui/skeleton'
import { PageIntro } from '@/components/travel-insurance/journey-layout'
import { InsurancePlan } from '@/types/plan'
import { TravelInsurancePlan } from './insurance-plan'
import ServerOffline from '../server-offline'
import { Input } from '../ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { LayoutList, Table2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { removeStorage } from '@/utils/remove-session-storage'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { storePlanName } from '@/utils/custom-fields-storage'
import { COMPANIES } from '@/constants/companies'
import { useTravelProviderFilter } from '@/store/travel-provider-filter-store'
import pacificCrossPlansData from '@/constants/pacific-cross-travel-plans.json'
import pacificCrossAsiaPlansData from '@/constants/pacific-cross-travel-plans-asia.json'
import pacificCrossDomesticPlansData from '@/constants/pacific-cross-travel-plans-domestic.json'
import { TierComparisonMatrix } from './tier-comparison-matrix'

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

type CoverageOptionsFormProps = {
  /** Re-run the search (used by the standalone plans page). */
  onRetry?: () => void
  /** Trip summary bar rendered directly under the page intro. */
  summary?: React.ReactNode
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
  const [sortBy, setSortBy] = useState<'lowest' | 'highest' | 'addons' | 'discounts'>('lowest')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list')
  const [showFilters, setShowFilters] = useState(true)

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
        if (sortBy === 'lowest') {
          return Number(a.Plan.DuePremium) - Number(b.Plan.DuePremium)
        }
        if (sortBy === 'addons') {
          // Among plans with add-ons, sort by number of add-ons descending
          const aAddons = (a.Plan.AddonBenefits || []).length
          const bAddons = (b.Plan.AddonBenefits || []).length
          return bAddons - aAddons
        }
        if (sortBy === 'discounts') {
          // Among discounted plans, sort by discount amount descending
          const aDiscount = Number(a.Plan.Discount || a.Plan.DiscountAmount || 0)
          const bDiscount = Number(b.Plan.Discount || b.Plan.DiscountAmount || 0)
          return bDiscount - aDiscount
        }
        // highest sum insured — use the max Silimit from MainBenefits or AddonBenefits
        const getMaxSi = (plan: any) => {
          const allBenefits = [...(plan.MainBenefits || []), ...(plan.AddonBenefits || [])]
          return Math.max(0, ...allBenefits.map((b: any) => Number(b.Silimit || 0)))
        }
        return getMaxSi(b.Plan) - getMaxSi(a.Plan)
      })
  }, [insurancePlans?.data, debouncedSearchFilter, sortBy, selectedProviders, selectedCoverages, travelDetails.travelDetailList, providerFilter])

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
    updateCoverageOption({ selectedPlan: plan, carrierCode })
    
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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-4 sm:gap-6">
          {isPlansFetching ? (
            <>
              <PageIntro
                title="Choose your travel plan"
                helper="Searching for the best plans for you…"
              />
              {summary}
            </>
          ) : (
            <>
              <PageIntro
                title="Choose your travel plan"
                helper={
                  allTravelPlans.length > 0
                    ? `${allTravelPlans.length} ${allTravelPlans.length === 1 ? 'plan matches' : 'plans match'} your trip.`
                    : undefined
                }
              />
              {summary}

              {/* Mobile-only horizontal sort pills */}
              <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                {(
                  [
                    { value: 'lowest', label: '↓ Lowest Price' },
                    { value: 'highest', label: '↑ Sum Insured' },
                    { value: 'addons', label: '✦ With Add-ons' },
                    { value: 'discounts', label: '% Discounts' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      sortBy === opt.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                {!providerFilter && availableProviders.map((code: string) => {
                  const company = COMPANIES.find((c) => c.carrierCode === code)
                  const isActive = selectedProviders.includes(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => toggleProvider(code)}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-card text-muted-foreground'
                      )}
                    >
                      {company?.companyName || code}
                    </button>
                  )
                })}
              </div>
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
                <div key={i} className="flex w-full overflow-hidden rounded-xl border">
                  <Skeleton className="w-[140px] sm:w-[160px] md:w-[180px] h-[120px] rounded-none" />
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 gap-3">
                    <Skeleton className="h-5 w-[55%]" />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                      <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                      <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
                    </div>
                  </div>
                  <div className="flex w-[140px] sm:w-[160px] md:w-[180px] shrink-0 flex-col items-center justify-center border-l p-4 gap-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>
                </div>
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
                Modify Search
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
                      {(
                        [
                          { value: 'lowest', label: 'Lowest premium' },
                          { value: 'highest', label: 'Highest sum insured' },
                          { value: 'addons', label: 'With add-ons' },
                          { value: 'discounts', label: 'With discounts' },
                        ] as const
                      ).map((opt) => (
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
                'flex min-w-0 flex-1 flex-col gap-3 overflow-x-clip px-2 sm:px-6',
                showFilters ? 'lg:pl-5' : 'lg:pl-6'
              )}
            >
              {/* Toolbar: search inline with List/Compare toggle */}
              <div className="flex items-center gap-2">
                {/* Expand-filters button — desktop only, shown when sidebar is hidden */}
                {!showFilters && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(true)}
                    aria-label="Show filters"
                    title="Show filters"
                    className="hidden lg:inline-flex shrink-0 h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                )}
                {/* Search — grows to fill available space, hidden on mobile (pills handle it there) */}
                <div className="hidden lg:flex flex-1 min-w-0">
                  <Input
                    className="h-9 w-full"
                    placeholder="Search plans…"
                    value={searchFilter}
                    onChange={handleSearchInputChange}
                  />
                </div>

                {/* List / Compare toggle — desktop only */}
                <div className="hidden lg:inline-flex shrink-0 rounded-full border border-border/60 bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                      viewMode === 'list'
                        ? 'bg-white text-foreground shadow-sm dark:bg-slate-900'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('compare')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                      viewMode === 'compare'
                        ? 'bg-white text-foreground shadow-sm dark:bg-slate-900'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Table2 className="h-3.5 w-3.5" />
                    Compare
                  </button>
                </div>

                {/* Mobile search — full width, visible only on small screens */}
                <div className="flex lg:hidden flex-1 min-w-0">
                  <Input
                    className="h-9 w-full"
                    placeholder="Search plans…"
                    value={searchFilter}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </div>

              {viewMode === 'list' ? (
                <div className="flex flex-col gap-2">
                  {allTravelPlans.map((item: any, index: number) => (
                    <TravelInsurancePlan
                      key={`${item.CarrierCode}-${item.Plan.CarrierPlanCode || item.Plan.CarrierPlanDesc}-${index}`}
                      plan={item.Plan}
                      carrierCode={item.CarrierCode}
                      selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                      isAvailable={!isFormModified}
                      redirectUrl={item.IsExternalLink === 'Y' ? item.RedirectUrl : undefined}
                      currency={item.Plan.Currency}
                      onSelectPlan={(plan, carrierCode) => {
                        handleSelectPlan(plan, carrierCode)
                        resetQuoteRefetchCount()
                      }}
                    />
                  ))}
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
                    {allTravelPlans.map((item: any, index: number) => (
                      <TravelInsurancePlan
                        key={`${item.CarrierCode}-${item.Plan.CarrierPlanCode || item.Plan.CarrierPlanDesc}-${index}`}
                        plan={item.Plan}
                        carrierCode={item.CarrierCode}
                        selectedPlan={coverageOption.selectedPlan?.CarrierPlanCode}
                        isAvailable={!isFormModified}
                        redirectUrl={item.IsExternalLink === 'Y' ? item.RedirectUrl : undefined}
                        currency={item.Plan.Currency}
                        onSelectPlan={(plan, carrierCode) => {
                          handleSelectPlan(plan, carrierCode)
                          resetQuoteRefetchCount()
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
