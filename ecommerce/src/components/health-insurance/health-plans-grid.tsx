'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PlanCardSkeleton,
  NoPlanState,
  SortFilterSidebar,
  PriceDisplay,
  PrimaryActionButton,
} from '@/components/ui/insurance-shared'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'

function getPremium(plan: any): number {
  return parseFloat(
    plan.GrossPremium ?? plan.DuePremium ?? plan.BeforeVatPremium ?? plan.NetPremium ?? '0'
  )
}

function getProvider(plan: any) {
  // The health insurance API returns CarrierCode as "HEALTH" (product code, not carrier)
  // The actual carrier is in CarrierProductCode or CarrierPlanCode
  // Pacific Cross health plans use CarrierProductCode "PHCI" or similar
  const fields = [
    plan.CarrierCode,
    plan.CarrierProductCode,
    plan.CarrierPlanCode,
  ].filter(Boolean).map((s: string) => s.toUpperCase())

  for (const field of fields) {
    // Exact match first
    const exact = COMPANIES.find((c) => c.carrierCode === field)
    if (exact) return exact
  }

  // Known health insurance carrier product codes
  for (const field of fields) {
    if (field.includes('PACIFIC') || field.includes('PCROSS') || field === 'PHCI') {
      return COMPANIES.find((c) => c.carrierCode === 'PACIFIC') ?? null
    }
    if (field.includes('OONA')) {
      return COMPANIES.find((c) => c.carrierCode === 'OONAPH') ?? null
    }
    if (field.includes('MALAYAN')) {
      return COMPANIES.find((c) => c.carrierCode === 'MALAYAN') ?? null
    }
  }

  return null
}

export function HealthPlansGrid() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'lowest' | 'highest'>('lowest')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { compareQuotePlans, addItem, isLoadingPlans, plansError } = useHealthCartStore()
  const { setStep } = useHealthAvailStore()

  const toggleProvider = (code: string) => {
    setSelectedProviders((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const availableProviders = useMemo(() => {
    if (!compareQuotePlans.length) return [] as string[]
    const providers = new Set<string>()
    compareQuotePlans.forEach((plan) => {
      const p = getProvider(plan)
      if (p) providers.add(p.carrierCode)
    })
    return Array.from(providers)
  }, [compareQuotePlans])

  const filtered = useMemo(() => {
    if (!compareQuotePlans.length) return []
    return compareQuotePlans
      .filter((plan) =>
        plan.CarrierPlanDesc?.toLowerCase().includes(search.toLowerCase()) ||
        plan.CarrierProductName?.toLowerCase().includes(search.toLowerCase())
      )
      .filter((plan) => {
        if (selectedProviders.length === 0) return true
        const p = getProvider(plan)
        return p ? selectedProviders.includes(p.carrierCode) : true
      })
      .sort((a, b) => {
        if (sortBy === 'lowest') return getPremium(a) - getPremium(b)
        const getMaxSi = (plan: any) => {
          const benefits = plan.MainBenefits || []
          return Math.max(0, ...benefits.map((b: any) => Number(b.Silimit || 0)))
        }
        return getMaxSi(b) - getMaxSi(a)
      })
  }, [compareQuotePlans, search, sortBy, selectedProviders])

  const handleGetStarted = (plan: typeof compareQuotePlans[0]) => {
    const provider = getProvider(plan)
    addItem({
      id: plan.CarrierPlanCode,
      planId: plan.CarrierPlanCode,
      planName: plan.CarrierPlanDesc,
      planSlug: plan.CarrierPlanCode,
      tierName: plan.CarrierPlanDesc,
      tierSubtitle: provider?.companyName ?? plan.CarrierProductName,
      tierDescription: plan.MainBenefits?.slice(0, 3).map((b: any) => b.BenefitDesc).join(', ') ?? '',
      provider: provider?.companyName ?? plan.CarrierProductName,
      providerSlug: plan.CarrierPlanCode,
      providerLogo: provider?.image ?? '',
      image: '/our-products-health.webp',
      premium: getPremium(plan),
      carrierCode: (plan as any).CarrierCode,
      carrierPlanCode: plan.CarrierPlanCode,
      carrierProductCode: plan.CarrierProductCode,
    }, 1)
    setStep(1)
    // If already on avail page, just set step; otherwise navigate there
    if (!window.location.pathname.includes('/avail')) {
      router.push(`/${agentCode}/products/health-insurance/avail`)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isPlansFetching = isLoadingPlans && !compareQuotePlans.length

  if (isPlansFetching) {
    return (
      <section id="health-plans-grid" className="w-full py-16">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header skeleton */}
          <div className="mb-10 text-center">
            <Skeleton className="mx-auto h-10 w-[60%] sm:h-12" />
          </div>
          {/* Toolbar skeleton */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-56 rounded-full" />
              <Skeleton className="h-9 w-36 rounded-full" />
            </div>
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
          {/* Content skeleton with sidebar */}
          <div className="flex gap-6">
            <aside className="hidden w-[200px] shrink-0 lg:block">
              <div className="sticky top-4 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </aside>
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
        </div>
      </section>
    )
  }

  if (plansError) {
    return (
      <section id="health-plans-grid" className="w-full py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl mb-8 text-center">
            Choose your Health Plans
          </h2>
          <NoPlanState
            message={
              plansError.toLowerCase().includes('agent') || plansError.toLowerCase().includes('authorized') || plansError.toLowerCase().includes('lob')
                ? "We're sorry, but health insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent."
                : plansError
            }
            onModifySearch={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        </div>
      </section>
    )
  }

  if (!compareQuotePlans.length) {
    return (
      <section id="health-plans-grid" className="w-full py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl mb-4">
            Choose your Health Plans
          </h2>
          <p className="text-muted-foreground text-base">
            Fill in the form above and click Get Advice to see available health insurance plans.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="health-plans-grid" className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            Choose your Health Plans
          </h2>
        </div>

        {/* Toolbar — matches travel insurance */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plans..."
                className="h-10 w-56 rounded-full bg-white pl-9 border border-border"
              />
            </div>
            <Button size="sm" className="from-primary to-accent rounded-full bg-gradient-to-r text-white gap-1.5">
              <span className="text-xs">↑↓</span>
              Recommended
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
            onClick={() => router.push(`/${agentCode}/products/health-insurance/cart`)}
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
          </Button>
        </div>

        {/* Plans list with sidebar — horizontal card layout */}
        <div className="flex gap-6">
          {/* Left sidebar filters */}
          <SortFilterSidebar
            sortOptions={[
              { key: 'lowest', label: 'Lowest premium' },
              { key: 'highest', label: 'Highest sum insured' },
            ]}
            currentSort={sortBy}
            onSortChange={(key) => setSortBy(key as 'lowest' | 'highest')}
            providers={availableProviders.map((code: string) => {
              const company = COMPANIES.find((c) => c.carrierCode === code)
              return {
                code,
                name: company?.companyName || code,
                isActive: selectedProviders.length === 0 || selectedProviders.includes(code),
              }
            })}
            onProviderToggle={toggleProvider}
          />

          {/* Plan cards */}
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              We have {filtered.length} recommendation{filtered.length !== 1 ? 's' : ''} to explore.
            </p>
            {filtered.map((plan) => {
              const provider = getProvider(plan)
              const logo = provider?.image ?? null
              const carrierName = provider?.companyName ?? plan.CarrierProductName ?? plan.CarrierCode ?? ''
              const premium = getPremium(plan)
              const benefits: any[] = plan.MainBenefits ?? []
              const brandColor = provider ? (CARRIER_BRAND_COLORS[provider.carrierCode] || { bg: '#374151', invertLogo: false, logoWhite: undefined, planCardLogo: undefined }) : { bg: '#374151', invertLogo: false, logoWhite: undefined, planCardLogo: undefined }
              const benefitsWithAmounts = benefits.filter((b: any) => b.Silimit || b.DefaultLimitDesc).slice(0, 3)

              return (
                <Card key={plan.CarrierPlanCode} variant="interactive" className="relative mb-3 w-full gap-0 overflow-hidden py-0 transition-all sm:flex-row">
                  {/* Left brand block */}
                  <div
                    className="flex h-[100px] w-full shrink-0 items-center justify-center overflow-hidden rounded-t-xl sm:h-auto sm:w-[140px] sm:rounded-l-xl sm:rounded-tr-none md:w-[160px] lg:w-[180px]"
                  >
                    {brandColor.planCardLogo ? (
                      <img
                        src={brandColor.planCardLogo}
                        alt={carrierName}
                        className={`h-full w-full object-contain ${provider?.carrierCode === 'PACIFIC' ? 'p-0 sm:p-2' : 'p-3 sm:p-8'}`}
                      />
                    ) : logo ? (
                      <img
                        src={logo}
                        alt={carrierName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-foreground text-center text-lg font-bold uppercase leading-tight tracking-wide sm:text-xl">
                        {carrierName}
                      </span>
                    )}
                  </div>

                  {/* Middle content */}
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-wide sm:text-base lg:text-lg">
                      {plan.CarrierPlanDesc}
                      {provider?.carrierCode === 'PACIFIC' && (
                        <a
                          href="/pacific-cross-health-brochure"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="ml-2 inline-block align-middle rounded-full border border-primary/40 px-1.5 py-px text-[9px] font-medium normal-case tracking-normal text-primary hover:bg-primary/10 transition-colors"
                        >
                          Brochure
                        </a>
                      )}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                      <div className="min-w-0">
                        <p className="text-foreground text-xs font-semibold sm:text-sm">
                          {Number((plan as any).SumInsured || 0).toLocaleString('en-PH')}
                        </p>
                        <p className="text-muted-foreground text-xs">Sum Insured</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-xs font-semibold sm:text-sm">
                          {carrierName}
                        </p>
                        <p className="text-muted-foreground text-xs">Provider</p>
                      </div>
                      <div className="min-w-0 col-span-2 sm:col-span-1">
                        <p className="text-foreground text-xs font-semibold sm:text-sm">
                          Health Insurance
                        </p>
                        <p className="text-muted-foreground text-xs">Coverage Type</p>
                      </div>
                    </div>
                  </div>

                  {/* Right price + button */}
                  <div className="flex w-full shrink-0 flex-col items-center justify-center border-t border-border p-4 sm:w-[140px] sm:flex-col sm:justify-center sm:border-l sm:border-t-0 md:w-[160px] lg:w-[180px]">
                    <PriceDisplay amount={premium} label="Premium" className="mb-3" />
                    <PrimaryActionButton
                      size="sm"
                      className="h-8 w-full px-4 text-xs font-semibold"
                      onClick={() => handleGetStarted(plan)}
                    >
                      Apply Now
                    </PrimaryActionButton>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">No plans match your search.</p>
        )}
      </div>
    </section>
  )
}
