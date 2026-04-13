'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { COMPANIES } from '@/constants/companies'

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
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { compareQuotePlans, addItem, isLoadingPlans } = useHealthCartStore()
  const { setStep } = useHealthAvailStore()

  const filtered = useMemo(() => {
    if (!compareQuotePlans.length) return []
    return compareQuotePlans.filter((plan) =>
      plan.CarrierPlanDesc?.toLowerCase().includes(search.toLowerCase()) ||
      plan.CarrierProductName?.toLowerCase().includes(search.toLowerCase())
    )
  }, [compareQuotePlans, search])

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
      <section id="health-plans-grid" className="w-full bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl mb-6">
            Choose your Health Plans
          </h2>
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground text-base">
              We're searching for the best plans for you. This may take a moment...
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!compareQuotePlans.length) {
    return (
      <section id="health-plans-grid" className="w-full bg-white py-16">
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
    <section id="health-plans-grid" className="w-full bg-white py-16">
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

        {/* Plans Grid — pixel-perfect match to travel insurance cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => {
            const provider = getProvider(plan)
            const logo = provider?.image ?? null
            const carrierName = provider?.companyName ?? plan.CarrierProductName ?? plan.CarrierCode ?? ''
            const premium = getPremium(plan)
            const benefits: any[] = plan.MainBenefits ?? []

            // Unique coverage names for checkmarks
            const coverageGroups = [...new Set(
              benefits.map((b: any) => b.CoverageName).filter(Boolean)
            )] as string[]

            // Fallback: use unique benefit descriptions if no coverage names
            const checkmarkItems = coverageGroups.length > 0
              ? coverageGroups.slice(0, 6)
              : [...new Set(benefits.map((b: any) => b.BenefitDesc).filter(Boolean))].slice(0, 6) as string[]

            // Benefits with amounts for the grid
            const benefitsWithAmounts = benefits.filter((b: any) => b.Silimit || b.DefaultLimitDesc)
            const amountItems = benefitsWithAmounts.slice(0, 4)

            return (
              <div key={plan.CarrierPlanCode} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                {/* Logo in bordered box — exactly like travel */}
                <div className="mb-3 flex h-16 w-32 items-center justify-center rounded-xl border border-gray-200 bg-white p-2">
                  {logo ? (
                    <img
                      src={logo}
                      alt={carrierName}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 text-center leading-tight">{carrierName}</span>
                  )}
                </div>

                {/* Provider name badge — bordered pill like travel */}
                <span className="mb-2 w-fit rounded-full border border-gray-200 px-3 py-0.5 text-xs text-gray-600">{carrierName}</span>

                {/* Plan name + price — same layout as travel */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="text-base font-black leading-snug text-gray-900 uppercase">
                    {plan.CarrierPlanDesc}
                  </h3>
                  {premium > 0 && (
                    <span className="shrink-0 rounded-full bg-[#F5A623] px-3 py-1.5 text-sm font-bold text-white whitespace-nowrap">
                      ₱ {premium.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </span>
                  )}
                </div>

                {/* Divider */}
                {checkmarkItems.length > 0 && <hr className="mb-3 border-gray-100" />}

                {/* Checkmarks — same style as travel */}
                {checkmarkItems.length > 0 && (
                  <ul className="mb-4 space-y-2.5">
                    {checkmarkItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="text-primary mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Benefit amounts grid — same as travel */}
                {amountItems.length > 0 && (
                  <>
                    <hr className="mb-3 border-gray-100" />
                    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-3">
                      {amountItems.map((b: any, i: number) => (
                        <div key={i}>
                          <p className="text-sm font-bold text-gray-900">
                            {b.DefaultLimitDesc || `Php ${Number(b.Silimit).toLocaleString()}`}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">{b.BenefitDesc}</p>
                        </div>
                      ))}
                    </div>
                    {benefits.length > 4 && (
                      <p className="mb-3 text-xs italic text-gray-400">and many more...</p>
                    )}
                  </>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                {/* Divider before button */}
                <hr className="mb-4 border-gray-100" />

                {/* Get Started button — same as travel */}
                <Button
                  className="from-primary to-accent w-full rounded-full bg-gradient-to-r py-2.5 text-sm font-semibold text-white"
                  onClick={() => handleGetStarted(plan)}
                >
                  Get Started
                </Button>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">No plans match your search.</p>
        )}
      </div>
    </section>
  )
}
