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

  const isSelected = selectedPlan && plan.CarrierPlanCode
    ? selectedPlan === plan.CarrierPlanCode
    : false
  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
  const brandColors = CARRIER_BRAND_COLORS[carrierCode] || {
    bg: '#374151',
    text: '#ffffff',
    invertLogo: false,
  }

  const logoSrc = brandColors.planCardLogo || provider?.image
  const visibleBenefits = benefits.slice(0, showMore ? benefits.length : 3)

  return (
    <div className="relative mb-4">
      <div
        className={cn(
          'bg-background w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        {/* ── MOBILE layout (< sm) ── */}
        <div className="flex flex-col sm:hidden">
          {/* Top row: logo + plan name + price */}
          <div className="flex items-center gap-3 p-3 pb-2">
            {/* Logo pill */}
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-gray-50 flex items-center justify-center">
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={provider?.companyName || carrierCode}
                  className={cn(
                    'h-full w-full object-contain',
                    carrierCode === 'PACIFIC' ? 'p-1' : 'p-2'
                  )}
                  width={64}
                  height={40}
                />
              ) : (
                <span className="text-[10px] font-bold uppercase text-center leading-tight text-foreground px-1">
                  {carrierCode}
                </span>
              )}
            </div>

            {/* Plan name */}
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground text-sm font-bold uppercase tracking-wide leading-tight line-clamp-2">
                {plan.CarrierPlanDesc}
                {carrierCode === 'PACIFIC' && (
                  <a
                    href="/pacific-cross-health-brochure"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-1.5 inline-block align-middle rounded-full border border-primary/40 px-1.5 py-px text-[9px] font-medium normal-case tracking-normal text-primary hover:bg-primary/10 transition-colors"
                  >
                    Brochure
                  </a>
                )}
              </h3>
              {provider && (
                <p className="text-muted-foreground text-[11px] mt-0.5">{provider.companyName}</p>
              )}
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
              <div className="flex items-baseline gap-0.5 justify-end">
                <span className="text-primary text-[10px] font-semibold">{currency || 'PHP'}</span>
                <span className="text-foreground text-lg font-black leading-none">
                  {Number(plan.DuePremium).toLocaleString('en-PH', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <p className="text-primary text-[10px] font-medium">Premium</p>
            </div>
          </div>

          {/* Benefits row */}
          {visibleBenefits.length > 0 && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 pb-2">
              {visibleBenefits.map((benefit, index) => (
                <div key={index} className="min-w-0">
                  <p className="text-foreground text-xs font-semibold truncate">
                    {benefit.Silimit
                      ? `₱${Number(benefit.Silimit).toLocaleString('en-PH')}`
                      : benefit.DefaultLimitDesc ?? benefit.LimitModeDesc}
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-tight line-clamp-1">
                    {benefit.BenefitDesc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Apply button */}
          <div className="px-3 pb-3 pt-1">
            <Button
              type="button"
              size="sm"
              className="w-full rounded-full from-primary to-accent bg-gradient-to-r text-xs font-semibold text-white hover:opacity-90"
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
              <p className="text-muted-foreground mt-1 text-center text-[10px]">
                via Pacific Cross secure site
              </p>
            )}
          </div>
        </div>

        {/* ── DESKTOP layout (≥ sm) ── */}
        <div className="hidden sm:flex w-full">
          {/* Left brand block */}
          <div className="flex h-auto w-[160px] shrink-0 items-center justify-center overflow-hidden md:w-[180px]">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={provider?.companyName || carrierCode}
                className={cn(
                  'h-full w-full object-contain',
                  carrierCode === 'PACIFIC' ? 'p-2' : 'p-8'
                )}
                width={180}
                height={120}
              />
            ) : provider ? (
              <Image
                src={provider.image}
                alt={provider.companyName}
                className="h-full w-full object-cover"
                width={180}
                height={120}
              />
            ) : (
              <span className="text-foreground text-center text-lg font-bold uppercase leading-tight tracking-wide sm:text-xl px-3">
                {carrierCode}
              </span>
            )}
          </div>

          {/* Middle content */}
          <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
            <h3 className="text-foreground text-base font-bold uppercase tracking-wide sm:text-lg">
              {plan.CarrierPlanDesc}
              {carrierCode === 'PACIFIC' && (
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

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {visibleBenefits.map((benefit, index) => (
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

          {/* Right price + button */}
          <div className="flex w-[160px] shrink-0 flex-col items-center justify-center gap-1 border-l border-gray-100 p-4 md:w-[180px]">
            <div className="flex items-baseline gap-1">
              <span className="text-primary text-xs font-semibold">{currency || 'PHP'}</span>
              <span className="text-foreground text-xl font-black sm:text-2xl">
                {Number(plan.DuePremium).toLocaleString('en-PH', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <span className="text-primary mb-2 text-xs font-medium">Premium</span>

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
              <span className="text-muted-foreground mt-1 text-center text-[10px]">
                via Pacific Cross secure site
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View more toggle */}
      {hasMore && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-background px-4 py-1 text-xs font-medium text-foreground transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
          >
            {showMore ? (
              <><span>View less</span><ChevronUp className="h-3 w-3" /></>
            ) : (
              <><span>View more</span><ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
