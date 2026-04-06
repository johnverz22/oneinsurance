'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search, ShoppingCart, SlidersHorizontal, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHealthCartStore } from '@/store/health-cart-store'
import { toast } from 'sonner'

export function HealthPlansGrid() {
  const [search, setSearch] = useState('')
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { compareQuotePlans, addItem, isLoadingPlans } = useHealthCartStore()

  const filtered = useMemo(() => {
    if (!compareQuotePlans.length) return []
    return compareQuotePlans.filter((plan) =>
      plan.CarrierPlanDesc?.toLowerCase().includes(search.toLowerCase()) ||
      plan.CarrierProductName?.toLowerCase().includes(search.toLowerCase())
    )
  }, [compareQuotePlans, search])

  const handleAddToCart = (plan: typeof compareQuotePlans[0]) => {
    addItem({
      id: plan.CarrierPlanCode,
      planId: plan.CarrierPlanCode,
      planName: plan.CarrierPlanDesc,
      planSlug: plan.CarrierPlanCode,
      tierName: plan.CarrierPlanDesc,
      tierSubtitle: plan.CarrierProductName,
      tierDescription: plan.MainBenefits?.slice(0, 3).map(b => b.BenefitDesc).join(', ') ?? '',
      provider: plan.CarrierProductName,
      providerSlug: plan.CarrierPlanCode,
      providerLogo: '/images/providers/1 Oona.svg',
      image: '/our-products-health.webp',
      premium: parseFloat(plan.GrossPremium ?? plan.DuePremium ?? '0'),
    }, 1)
    toast.success(`${plan.CarrierPlanDesc} added to cart`)
  }

  const handleBuyNow = (plan: typeof compareQuotePlans[0]) => {
    addItem({
      id: plan.CarrierPlanCode,
      planId: plan.CarrierPlanCode,
      planName: plan.CarrierPlanDesc,
      planSlug: plan.CarrierPlanCode,
      tierName: plan.CarrierPlanDesc,
      tierSubtitle: plan.CarrierProductName,
      tierDescription: plan.MainBenefits?.slice(0, 3).map(b => b.BenefitDesc).join(', ') ?? '',
      provider: plan.CarrierProductName,
      providerSlug: plan.CarrierPlanCode,
      providerLogo: '/images/providers/1 Oona.svg',
      image: '/our-products-health.webp',
      premium: parseFloat(plan.GrossPremium ?? plan.DuePremium ?? '0'),
    }, 1)
    router.push(`/${agentCode}/products/health-insurance/checkout`)
  }

  if (isLoadingPlans) {
    return (
      <section id="health-plans-grid" className="w-full bg-[#eef2f7] py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl mb-6">
            Finding Your Health Plans
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
      <section id="health-plans-grid" className="w-full bg-[#eef2f7] py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl mb-4">
            Choose Your Health Plans
          </h2>
          <p className="text-muted-foreground text-base">
            Fill in the form above and click Get Advice to see available health insurance plans.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="health-plans-grid" className="w-full bg-[#eef2f7] py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            Available Health Plans
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            {filtered.length} plan{filtered.length !== 1 ? 's' : ''} found based on your details
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Plan..."
                className="h-10 w-56 rounded-full bg-white pl-9"
              />
            </div>
            <Button size="sm" className="from-primary to-accent rounded-full bg-gradient-to-r text-white gap-1.5">
              <span className="text-xs">↑↓</span>
              Recommended
            </Button>
            <Button size="sm" variant="outline" className="rounded-full">All</Button>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
          <Button
            size="sm"
            className="from-primary to-accent rounded-full bg-gradient-to-r text-white gap-1.5"
            onClick={() => router.push(`/${agentCode}/products/health-insurance/cart`)}
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <div key={plan.CarrierPlanCode} className="flex flex-col rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="from-primary to-accent mb-1 bg-gradient-to-r bg-clip-text text-center text-xl font-black text-transparent">
                {plan.CarrierPlanDesc}
              </h3>
              <p className="text-muted-foreground mb-4 text-center text-xs">{plan.CarrierProductName}</p>

              <div className="mb-2 flex items-center justify-between rounded-lg bg-yellow-400 px-4 py-2">
                <span className="text-sm font-medium text-gray-800">Gross Premium</span>
                <span className="font-bold text-gray-900">
                  ₱ {parseFloat(plan.GrossPremium ?? '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {plan.SumInsured && (
                <div className="mb-5 flex items-center justify-between rounded-lg bg-green-500 px-4 py-2">
                  <span className="text-sm font-medium text-white">Sum Insured</span>
                  <span className="font-bold text-white">
                    ₱ {parseFloat(plan.SumInsured).toLocaleString('en-PH')}
                  </span>
                </div>
              )}

              {/* Benefits */}
              <ul className="mb-6 flex-1 space-y-2">
                {(plan.MainBenefits ?? []).slice(0, 5).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>{b.BenefitDesc}</span>
                    {b.DefaultLimitDesc && (
                      <span className="ml-auto shrink-0 text-xs text-gray-400">{b.DefaultLimitDesc}</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleBuyNow(plan)}
                >
                  Buy Now
                </Button>
                <Button
                  size="sm"
                  className="from-primary to-accent rounded-full bg-gradient-to-r text-white"
                  onClick={() => handleAddToCart(plan)}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">No plans match your search.</p>
        )}
      </div>
    </section>
  )
}
