'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getHighlightedBenefits,
  groupBenefits,
} from '@/utils/travel-benefits-helpers'
import { InsurancePlan } from '@/types/plan'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import Image from 'next/image'

interface TravelInsurancePlanProps {
  plan: InsurancePlan
  carrierCode: string
  selectedPlan?: string
  isAvailable?: boolean
  redirectUrl?: string
  currency?: string
  onSelectPlan: (plan: InsurancePlan, carrierCode: string) => void
}

export function TravelInsurancePlan({
  plan,
  selectedPlan,
  carrierCode,
  onSelectPlan,
  isAvailable = true,
  redirectUrl,
  currency,
}: TravelInsurancePlanProps) {
  const [showMore, setShowMore] = useState(false)
  const group = groupBenefits(plan)
  const { benefits, hasMore } = getHighlightedBenefits(group, showMore)

  const isSelected = selectedPlan && plan.CarrierPlanCode ? selectedPlan === plan.CarrierPlanCode : false
  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
  const brandColors = CARRIER_BRAND_COLORS[carrierCode] || { bg: '#374151', text: '#ffffff', invertLogo: false }

  return (
    <div
      className={cn(
        'relative mb-3',
      )}
    >
      <div className={cn(
        'bg-background flex w-full rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md',
        {
          'ring-primary shadow-lg ring-2': isSelected,
        }
      )}>
      {/* Left brand block */}
      <div
        className="flex w-[140px] shrink-0 flex-col items-center justify-center p-4 sm:w-[160px] md:w-[180px]"
        style={{ backgroundColor: brandColors.bg }}
      >
        {brandColors.logoWhite ? (
          <Image
            src={brandColors.logoWhite}
            alt={provider?.companyName || carrierCode}
            className="h-auto w-[100px] object-contain sm:w-[120px]"
            width={120}
            height={80}
          />
        ) : provider && brandColors.invertLogo ? (
          <Image
            src={provider.image}
            alt={provider.companyName}
            className="h-auto w-[100px] object-contain brightness-0 invert sm:w-[120px]"
            width={120}
            height={80}
          />
        ) : (
          <span className="text-center text-lg font-bold uppercase leading-tight tracking-wide text-white sm:text-xl">
            {provider?.companyName || carrierCode}
          </span>
        )}
      </div>

      {/* Middle content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        {/* Plan name */}
        <h3 className="text-foreground text-base font-bold uppercase tracking-wide sm:text-lg">
          {plan.CarrierPlanDesc}
        </h3>

        {/* Benefits grid */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {benefits.slice(0, showMore ? benefits.length : 3).map((benefit, index) => (
            <div key={index} className="min-w-0">
              <p className="text-foreground text-sm font-semibold">
                {benefit.Silimit
                  ? `${Number(benefit.Silimit).toLocaleString('en-PH')}`
                  : benefit.DefaultLimitDesc ?? benefit.LimitModeDesc}
              </p>
              <p className="text-muted-foreground text-xs">
                {benefit.BenefitDesc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right price + button section */}
      <div className="flex w-[130px] shrink-0 flex-col items-center justify-center border-l border-gray-100 p-4 sm:w-[150px]">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-primary text-xs font-semibold">{currency || 'PHP'}</span>
          <span className="text-foreground text-xl font-black sm:text-2xl">
            {Number(plan.DuePremium).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <span className="text-primary mb-3 text-xs font-medium">Premium</span>

        <Button
          type="button"
          size="sm"
          className="w-full rounded-full from-primary to-accent bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          disabled={!isAvailable}
          onClick={() => {
            if (redirectUrl) {
              window.open(redirectUrl, '_blank')
            } else {
              onSelectPlan(plan, carrierCode)
            }
          }}
        >
          Apply Now
        </Button>
        {redirectUrl && (
          <span className="text-muted-foreground mt-1 text-center text-[10px]">via Pacific Cross secure site</span>
        )}
      </div>
      </div>

      {/* View more toggle — floating on bottom border */}
      {hasMore && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-background px-4 py-1 text-xs font-medium text-foreground transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {showMore ? (
              <>View less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>View more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
