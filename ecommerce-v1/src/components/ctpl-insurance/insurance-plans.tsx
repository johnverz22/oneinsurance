'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  InsurancePlan,
  InsuranceBenefit,
} from '@/types/ctpl-insurance/init-compare'
import { Separator } from '@/components/ui/separator'

export function groupBenefits(plan: InsurancePlan) {
  if (!plan || !plan.MainBenefits) {
    return []
  }

  const mainBenefits = plan.MainBenefits || []

  const benefits = mainBenefits.reduce(
    (grp, benefit) => {
      const coverageName = benefit.BenefitDesc

      if (!coverageName) {
        return grp
      }

      if (!grp[coverageName]) {
        grp[coverageName] = []
      }
      grp[coverageName].push(benefit)
      return grp
    },
    {} as Record<string, InsuranceBenefit[]>
  )

  return Object.entries(benefits)
    .map(([coverageName, benefits]) => ({
      coverageName,
      benefits,
    }))
    .slice()
    .sort((a, b) => a.coverageName.localeCompare(b.coverageName))
}

interface TravelInsurancePlansProps {
  plans: InsurancePlan[]
  selectedPlan: string
  carrierCode: string
  onSelectPlan: (plan: InsurancePlan, carrierCode: string) => void
}

export function InsurancePlans({
  plans,
  selectedPlan,
  carrierCode,
  onSelectPlan,
}: TravelInsurancePlansProps) {
  const allPlans = useMemo(() => {
    return plans
      .slice()
      .toSorted((a, b) => Number(b.DuePremium) - Number(a.DuePremium))
  }, [plans])

  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {allPlans.map((plan: InsurancePlan, index) => {
        const group = groupBenefits(plan)

        const isSelected = selectedPlan === plan.CarrierPlanCode

        return (
          <div
            key={index}
            className={cn(
              'bg-background relative h-full flex-1/3 items-start space-y-3 rounded-lg border px-4 py-8 transition-all duration-200 hover:shadow-md',
              {
                'ring-lilac shadow-lg ring-1': isSelected,
              }
            )}
          >
            <div className="mb-4 flex flex-col items-start space-y-2">
              <Badge variant="outline">{carrierCode}</Badge>
              <h3 className="text-foreground text-left text-xl font-bold tracking-wide text-wrap uppercase">
                {plan.CarrierProductName}
              </h3>
              <div className="text-2xl font-bold text-success">
                PHP {plan.GrossPremium.toLocaleString()}
              </div>
            </div>

            <Separator />
            {Object.entries(group).map(([i, benefits]) => (
              <div key={i} className="flex items-center gap-4">
                <Check className="text-primary shrink-0" />
                <h4 className="font-semibold">{benefits.coverageName}</h4>
              </div>
            ))}

            <Button
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className="w-full"
              disabled={isSelected}
              onClick={() => {
                onSelectPlan(plan, carrierCode)
              }}
            >
              {isSelected ? 'Selected' : 'Try this'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
