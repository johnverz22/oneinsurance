'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, ShoppingCart, Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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

  if (isLoadingPlans) {
    return (
      <section id="health-plans-grid" className="w-full py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl mb-6 text-center">
            Choose your Health Plans
          </h2>
          <div className="flex flex-col gap-4 py-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex w-full overflow-hidden rounded-xl border">
                <Skeleton className="w-[140px] sm:w-[160px] md:w-[180px] h-[140px] rounded-none" />
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <Skeleton className="h-5 w-[60%] mb-3" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                    <div><Skeleton className="h-4 w-20 mb-1" /><Skeleton className="h-3 w-28" /></div>
                    <div><Skeleton className="h-4 w-20 mb-1" /><Skeleton className="h-3 w-28" /></div>
                    <div><Skeleton className="h-4 w-20 mb-1" /><Skeleton className="h-3 w-28" /></div>
                  </div>
                </div>
                <div className="flex w-[130px] sm:w-[150px] shrink-0 flex-col items-center justify-center border-l p-4">
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-14 mb-3" />
                  <Skeleton className="h-9 w-full rounded-full" />
                </div>
              </div>
            ))}
            <p className="text-muted-foreground text-center text-sm">
              Searching for the best plans for you...
            </p>
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
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <TriangleAlert className="h-7 w-7 text-gray-400" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">No Plans Available</h3>
            <p className="mb-4 text-sm text-gray-500">
              {plansError.toLowerCase().includes('agent') || plansError.toLowerCase().includes('authorized') || plansError.toLowerCase().includes('lob')
                ? "We're sorry, but health insurance plans are not currently available through this link. This may be because the service is not yet enabled for this agent."
                : plansError}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Modify Search
            </button>
          </div>
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
                className="h-10 w-56 rounded-full bg-white pl-9 border border-gray-200"
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
          <aside className="hidden w-[200px] shrink-0 lg:block">
            <div className="sticky top-4 space-y-6">
              <div>
                <h4 className="text-foreground mb-2 text-sm font-bold">Sorted by</h4>
                <ul className="space-y-1.5">
                  <li>
                    <button type="button" onClick={() => setSortBy('lowest')} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                      <span className={`h-2.5 w-2.5 rounded-full border ${sortBy === 'lowest' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                      Lowest premium
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setSortBy('highest')} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                      <span className={`h-2.5 w-2.5 rounded-full border ${sortBy === 'highest' ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                      Highest sum insured
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-foreground mb-2 text-sm font-bold">By providers</h4>
                <ul className="space-y-1.5">
                  {availableProviders.map((code: string) => {
                    const company = COMPANIES.find((c) => c.carrierCode === code)
                    const isActive = selectedProviders.length === 0 || selectedProviders.includes(code)
                    return (
                      <li key={code}>
                        <button type="button" onClick={() => toggleProvider(code)} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                          <span className={`h-2.5 w-2.5 rounded-full border ${isActive ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
                          {company?.companyName || code}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </aside>

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
              const brandColor = provider ? (CARRIER_BRAND_COLORS[provider.carrierCode] || { bg: '#374151', invertLogo: false, logoWhite: undefined }) : { bg: '#374151', invertLogo: false, logoWhite: undefined }
              const benefitsWithAmounts = benefits.filter((b: any) => b.Silimit || b.DefaultLimitDesc).slice(0, 3)

              return (
                <div key={plan.CarrierPlanCode} className="bg-background relative flex w-full rounded-xl overflow-hidden transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-md mb-3">
                  {/* Left brand block */}
                  <div
                    className="flex w-[140px] shrink-0 flex-col items-center justify-center p-4 sm:w-[160px] md:w-[180px]"
                    style={{ backgroundColor: brandColor.bg }}
                  >
                    {brandColor.logoWhite ? (
                      <img
                        src={brandColor.logoWhite}
                        alt={carrierName}
                        className="h-auto w-[100px] object-contain sm:w-[120px]"
                      />
                    ) : logo && brandColor.invertLogo ? (
                      <img
                        src={logo}
                        alt={carrierName}
                        className="h-auto w-[100px] object-contain brightness-0 invert sm:w-[120px]"
                      />
                    ) : (
                      <span className="text-center text-lg font-bold uppercase leading-tight tracking-wide text-white sm:text-xl">
                        {carrierName}
                      </span>
                    )}
                  </div>

                  {/* Middle content */}
                  <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                    <h3 className="text-foreground text-base font-bold uppercase tracking-wide sm:text-lg">
                      {plan.CarrierPlanDesc}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                      {benefitsWithAmounts.map((b: any, i: number) => (
                        <div key={i} className="min-w-0">
                          <p className="text-foreground truncate text-sm font-semibold">
                            {b.DefaultLimitDesc || `Php ${Number(b.Silimit).toLocaleString('en-PH')}`}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">{b.BenefitDesc}</p>
                        </div>
                      ))}
                    </div>
                    {benefits.length > 3 && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-background px-4 py-1 text-xs font-medium text-foreground">
                          View more ›
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right price + button */}
                  <div className="flex w-[130px] shrink-0 flex-col items-center justify-center border-l border-gray-100 dark:border-gray-800 p-4 sm:w-[150px]">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-foreground text-xs font-semibold">PHP</span>
                      <span className="text-foreground text-xl font-black sm:text-2xl">
                        {premium.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <span className="text-primary mb-3 text-xs font-medium">Premium</span>
                    <Button
                      size="sm"
                      className="w-full rounded-full from-primary to-accent bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                      onClick={() => handleGetStarted(plan)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
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
