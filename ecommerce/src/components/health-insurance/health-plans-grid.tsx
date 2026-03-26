'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HEALTH_PLANS, type HealthPlan } from '@/constants/health-insurance-plans'

export function HealthPlansGrid() {
  const [search, setSearch] = useState('')
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string

  const filtered = useMemo(() => {
    return HEALTH_PLANS.filter((plan) =>
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.provider.toLowerCase().includes(search.toLowerCase()) ||
      plan.description.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <section className="w-full bg-[#eef2f7] py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            Choose Your Health Plans
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            Discover a wide range of solutions from various providers to help safeguard you from life's unexpected challenges.
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
          <Button size="sm" className="from-primary to-accent rounded-full bg-gradient-to-r text-white gap-1.5" onClick={() => router.push(`/${agentCode}/products/health-insurance/cart`)}>
            <ShoppingCart className="h-4 w-4" />
            View Cart
          </Button>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} agentCode={agentCode} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">No plans match your search.</p>
        )}
      </div>
    </section>
  )
}

function PlanCard({ plan, agentCode }: { plan: HealthPlan; agentCode: string }) {
  const router = useRouter()

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={plan.image}
          alt={plan.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 h-8">
          <Image
            src={plan.providerLogo}
            alt={plan.provider}
            width={90}
            height={32}
            className="h-8 w-auto object-contain object-left"
          />
        </div>
        <p className="text-muted-foreground mb-4 flex-1 text-sm leading-relaxed line-clamp-2">
          {plan.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-auto w-full rounded-full border-gray-300 text-sm font-medium"
          onClick={() => router.push(`/${agentCode}/products/health-insurance/providers/${plan.providerSlug}`)}
        >
          Learn More
        </Button>
      </div>
    </div>
  )
}
