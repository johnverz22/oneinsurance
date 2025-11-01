'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getHighlightedBenefits,
  groupBenefits,
  groupPlanBenefits,
  parseLimit,
} from '@/utils/travel-benefits-helpers'
import { InsurancePlan } from '@/types/plan'
import { Separator } from '@/components/ui/separator'
import { COMPANIES } from '@/constants/companies'
import Image from 'next/image'

interface TravelInsurancePlanProps {
  plan: InsurancePlan
  carrierCode: string
  selectedPlan?: string
  isAvailable?: boolean
  onSelectPlan: (plan: InsurancePlan, carrierCode: string) => void
}

export function TravelInsurancePlan({
  plan,
  selectedPlan,
  carrierCode,
  onSelectPlan,
  isAvailable = true,
}: TravelInsurancePlanProps) {
  const group = groupBenefits(plan)
  const { benefits, hasMore } = getHighlightedBenefits(group)

  const isSelected = selectedPlan === plan.CarrierPlanCode
  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)!

  return (
    <div
      className={cn(
        'bg-background relative flex h-full w-full flex-col items-start gap-3 rounded-lg border px-4 py-8 transition-all duration-200 hover:shadow-md',
        {
          'ring-lilac shadow-lg ring-1': isSelected,
        }
      )}
    >
      <div className="h-full w-full space-y-3">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="w-1/2 space-y-2">
            <div className="border-muted-foreground/10 relative flex h-20 w-32 items-center justify-center rounded-md border bg-white px-3 py-6">
              <Image
                src={provider.image}
                alt={provider.companyName}
                className="rounded-lg"
                width={640}
                height={640}
              />
            </div>

            <Badge variant="outline">{provider?.companyName}</Badge>
            <h3 className="text-foreground text-left text-base font-bold tracking-wide text-wrap uppercase lg:text-lg">
              {plan.CarrierPlanDesc}
            </h3>
          </div>

          <div className="bg-tertiary w-max rounded-full px-6 py-2 text-center text-base font-bold text-white">
            ₱ {plan.GrossPremium.toLocaleString()}
          </div>
        </div>

        <Separator />
        {Object.entries(group).map(([i, benefits]) => (
          <div key={i} className="flex items-center gap-4">
            <Check className="text-primary shrink-0" />
            <h4 className="text-sm font-semibold">{benefits.coverageName}</h4>
          </div>
        ))}

        <Separator />
        <div className="grid grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div key={index}>
              <h4 className="line-clamp-2">
                {benefit.DefaultLimitDesc ?? benefit.LimitModeDesc}
              </h4>
              <small className="text-muted-foreground line-clamp-2">
                {benefit.BenefitDesc}
              </small>
            </div>
          ))}
          {hasMore && (
            <small className="text-muted-foreground italic">
              and many more...
            </small>
          )}
        </div>
      </div>
      <Separator />

      <Button
        type="button"
        size="lg"
        className="from-primary to-accent w-1/2 self-end rounded-full bg-gradient-to-r via-90% dark:text-white"
        disabled={!isAvailable}
        onClick={() => {
          onSelectPlan(plan, carrierCode)
        }}
      >
        Get Started
      </Button>
    </div>
  )
}
