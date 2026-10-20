'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Search, ShoppingCart, SlidersHorizontal, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HEALTH_PROVIDERS, HEALTH_PLANS } from '@/constants/health-insurance-plans'
import { HealthDetailsForm } from '@/components/health-insurance/health-details-form'

export default function ProviderPage() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const providerSlug = params['provider'] as string
  const [search, setSearch] = useState('')
  const [showAdviceForm, setShowAdviceForm] = useState(false)

  const provider = HEALTH_PROVIDERS.find((p) => p.slug === providerSlug)
  const plans = useMemo(
    () => HEALTH_PLANS.filter((p) => p.providerSlug === providerSlug &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
       p.description.toLowerCase().includes(search.toLowerCase()))
    ),
    [providerSlug, search]
  )

  if (!provider) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Provider not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-section">
      {/* Header bar */}
      <div className="bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/${agentCode}`} className="hover:text-primary">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Providers</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{provider.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="One Insurance" width={2172} height={724} className="h-8 w-auto" />
            <Image src="/images/IFRC.png" alt="IFRC" width={1290} height={800} className="h-10 w-auto" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Provider hero card */}
        {!showAdviceForm ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative h-56 overflow-hidden rounded-xl">
                <img src={provider.image} alt={provider.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <Image src={provider.logo} alt={provider.name} width={120} height={48} className="h-12 w-auto object-contain object-left" />
                <h1 className="text-2xl font-bold text-foreground">{provider.name}</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">{provider.description}</p>
                <Button
                  variant="outline"
                  className="w-fit rounded-full"
                  onClick={() => setShowAdviceForm(true)}
                >
                  Get Advice
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <button
              onClick={() => setShowAdviceForm(false)}
              className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <HealthDetailsForm />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
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
              <span className="text-xs">↑↓</span> Recommended
            </Button>
            <Button size="sm" variant="outline" className="rounded-full">All</Button>
            <Button size="sm" variant="outline" className="rounded-full gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
          <Button size="sm" className="from-primary to-accent rounded-full bg-gradient-to-r text-white gap-1.5">
            <ShoppingCart className="h-4 w-4" /> View Cart
          </Button>
        </div>

        {/* Plans grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={plan.image} alt={plan.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 h-8">
                  <Image src={plan.providerLogo} alt={plan.provider} width={80} height={32} className="h-8 w-auto object-contain object-left" />
                </div>
                <h3 className="mb-1 text-base font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground mb-4 flex-1 text-xs leading-relaxed line-clamp-2">{plan.description}</p>
                <button
                  onClick={() => router.push(`/${agentCode}/products/health-insurance/providers/${providerSlug}/${plan.slug}`)}
                  className="from-primary to-accent flex h-10 w-10 items-center justify-center self-end rounded-full bg-gradient-to-r text-white shadow-md transition-transform hover:scale-105"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <p className="text-muted-foreground py-16 text-center">No plans found.</p>
        )}
      </div>
    </div>
  )
}
