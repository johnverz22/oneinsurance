'use client'

import { useHealthCartStore } from '@/store/health-cart-store'
import { COMPANIES } from '@/constants/companies'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Info } from 'lucide-react'

export function HealthPremiumSummary() {
  const { items, duePremium } = useHealthCartStore()
  const item = items[0]
  const cartTotal = items.reduce((sum, i) => sum + i.premium * i.quantity, 0)
  // Use DuePremium from full-quote if available, otherwise fall back to cart item premium
  const total = duePremium ?? cartTotal

  if (!item) return null

  const provider = COMPANIES.find(c => c.carrierCode === item.carrierCode) ?? null
  const providerName = provider?.companyName ?? item.provider

  return (
    <div className="sticky top-24 flex w-full flex-col space-y-6">
      <Card className="bg-background overflow-hidden p-0 shadow-none">
        <CardHeader className="pt-6 pb-4">
          <h2 className="text-center text-lg sm:text-2xl font-black text-foreground dark:text-muted-foreground">
            Total Premium
          </h2>
          <p className="text-center text-lg sm:text-2xl font-bold md:text-3xl lg:text-4xl mt-2">
            ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-8">
          {/* Insurance Provider — separate bordered box like travel */}
          <div className="rounded-lg border border-border px-4 py-3">
            <div className="text-sm text-muted-foreground mb-1">Insurance Provider</div>
            <div className="font-semibold text-foreground dark:text-muted-foreground">
              {providerName}
            </div>
          </div>

          {/* Plan — separate bordered box like travel */}
          <div className="rounded-lg border border-border px-4 py-3">
            <div className="text-sm text-muted-foreground mb-1">Plan</div>
            <div className="font-semibold text-foreground dark:text-muted-foreground uppercase">
              {item.planName}
            </div>
          </div>

          {/* About this premium — with Info icon, left-aligned like travel */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground dark:text-muted-foreground">
              <Info className="h-4 w-4" />
              About this premium
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The total premium already includes the base insurance cost, applicable taxes and fees as determined by the insurance provider.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
