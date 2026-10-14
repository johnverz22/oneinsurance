'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  HeartPulse,
  ShieldAlert,
  Luggage,
  Plane,
  LifeBuoy,
  Scale,
  Star,
  Circle,
  CheckCircle2,
  Infinity,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PriceDisplay, PrimaryActionButton } from '@/components/ui/insurance-shared'
import {
  groupBenefitsByCategory,
  resolveLimitDisplay,
  BenefitCategory,
} from '@/utils/travel-benefits-helpers'
import { InsuranceBenefit, InsurancePlan } from '@/types/plan'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import Image from 'next/image'

// ─── icon resolver ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  HeartPulse,
  ShieldAlert,
  Luggage,
  Plane,
  LifeBuoy,
  Scale,
  Star,
  Circle,
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Circle
  return <Icon className={className} />
}

// ─── limit helpers ────────────────────────────────────────────────────────────

function formatLimitShort(benefit: InsuranceBenefit): string | null {
  const display = resolveLimitDisplay(benefit)
  if (display.kind === 'amount') {
    const n = Number(display.value)
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `₱${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
    return `₱${n.toLocaleString('en-PH')}`
  }
  if (display.kind === 'badge') return display.label
  if (display.kind === 'text') return display.text
  return null
}

function LimitBadge({ benefit }: { benefit: InsuranceBenefit }) {
  const display = resolveLimitDisplay(benefit)

  if (display.kind === 'amount') {
    return (
      <span className="text-foreground text-xs font-bold tabular-nums whitespace-nowrap">
        ₱{Number(display.value).toLocaleString('en-PH', { maximumFractionDigits: 0 })}
      </span>
    )
  }

  if (display.kind === 'badge') {
    const isUnlimited = display.label.toLowerCase() === 'unlimited'
    return (
      <span className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
        isUnlimited
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
          : 'bg-success/10 text-success dark:bg-green-950 dark:text-green-300'
      )}>
        {isUnlimited ? <Infinity className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
        {display.label}
      </span>
    )
  }

  if (display.kind === 'text') {
    // Longer free-text limits (e.g. "Travel cost plus up to Php 5,000/day…")
    // don't fit a chip — render as wrapped text
    return (
      <span className="text-foreground text-[11px] font-medium leading-tight">
        {display.text}
      </span>
    )
  }

  return <span className="text-muted-foreground text-xs">—</span>
}

// ─── collapsed: 3-column benefit snapshot (matches old UI style) ──────────────

function CollapsedBenefits({ categories }: { categories: BenefitCategory[] }) {
  // Pick the top benefit from each category — max 6 to fit 2 rows of 3
  const highlights = categories.slice(0, 6).map((cat) => {
    const top = cat.benefits.reduce((best, b) => {
      return Number(b.Silimit ?? 0) > Number(best.Silimit ?? 0) ? b : best
    }, cat.benefits[0])
    return { cat, benefit: top }
  })

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
      {highlights.map(({ cat, benefit }, i) => {
        const limitStr = formatLimitShort(benefit)
        const display = resolveLimitDisplay(benefit)
        const isUnlimited = display.kind === 'badge' && display.label.toLowerCase() === 'unlimited'
        const isIncluded = display.kind === 'badge' && display.label.toLowerCase() === 'included'
        return (
          <div key={i} className="min-w-0 flex items-start gap-1.5">
            <CategoryIcon
              name={cat.config.icon}
              className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5"
            />
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-bold leading-tight',
                isUnlimited ? 'text-blue-600 dark:text-blue-400' :
                isIncluded  ? 'text-success dark:text-success' :
                'text-foreground'
              )}>
                {limitStr ?? '—'}
              </p>
              <p className="text-muted-foreground text-xs leading-tight line-clamp-1">
                {cat.config.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── expanded: 2-column category detail ──────────────────────────────────────

function CategorySection({ category }: { category: BenefitCategory }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <CategoryIcon name={category.config.icon} className="h-3 w-3 text-primary shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {category.config.label}
        </span>
      </div>
      <div className="space-y-0.5">
        {category.benefits.map((benefit, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-2 rounded px-2 py-0.5 odd:bg-muted/30"
          >
            <span className="text-muted-foreground text-[11px] leading-snug flex-1">
              {benefit.BenefitDesc}
              {benefit.LimitModeDesc && (
                <span className="block text-[10px] text-muted-foreground/60 mt-0.5 italic">
                  {benefit.LimitModeDesc}
                </span>
              )}
            </span>
            <div className="shrink-0 text-right">
              <LimitBadge benefit={benefit} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── props ────────────────────────────────────────────────────────────────────

interface TravelInsurancePlanProps {
  plan: InsurancePlan
  carrierCode: string
  selectedPlan?: string
  isAvailable?: boolean
  redirectUrl?: string
  currency?: string
  onSelectPlan: (plan: InsurancePlan, carrierCode: string) => void
}

// ─── main component ───────────────────────────────────────────────────────────

export function TravelInsurancePlan({
  plan,
  selectedPlan,
  carrierCode,
  onSelectPlan,
  isAvailable = true,
  redirectUrl,
  currency,
}: TravelInsurancePlanProps) {
  const [expanded, setExpanded] = useState(false)

  const categories = groupBenefitsByCategory(plan)
  const totalBenefits = categories.reduce((s, c) => s + c.benefits.length, 0)

  const isSelected = selectedPlan && plan.CarrierPlanCode
    ? selectedPlan === plan.CarrierPlanCode
    : false

  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
  const brandColors = CARRIER_BRAND_COLORS[carrierCode] || { bg: '#374151', text: '#ffffff', invertLogo: false }
  const logoSrc = brandColors.planCardLogo || provider?.image

  const handleAction = () => {
    if (redirectUrl) window.open(redirectUrl, '_blank')
    else onSelectPlan(plan, carrierCode)
  }

  return (
    <div className={cn('relative mb-2')}>
      <Card
        variant="interactive"
        className={cn(
          'w-full gap-0 border-border/60 py-0 transition-all duration-200 hover:border-primary/30',
          isSelected && 'border-primary ring-2 ring-primary'
        )}
      >

        {/* ══════════ COLLAPSED: original 3-panel layout ══════════════════════ */}
        <div className={cn('flex w-full min-h-[120px]', expanded && 'border-b border-border/40')}>

          {/* Left: logo block — fixed size so card height is driven by middle column, not logo padding */}
          <div className="flex w-[120px] shrink-0 items-center justify-center overflow-hidden sm:w-[160px] md:w-[180px]">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={provider?.companyName || carrierCode}
                className={cn(
                  'h-full w-full object-contain',
                  carrierCode === 'PACIFIC' ? 'p-2 sm:p-3' : 'p-4 sm:p-6'
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
              <span className="text-foreground text-center text-sm font-bold uppercase leading-tight tracking-wide px-3">
                {carrierCode}
              </span>
            )}
          </div>

          {/* Middle: plan name + benefit snapshot */}
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

            {categories.length > 0 && (
              <div className="mt-3">
                <CollapsedBenefits categories={categories} />
              </div>
            )}
          </div>

          {/* Right: price + button — self-stretch fills full row height so justify-between always splits evenly */}
          <div className="flex w-[140px] shrink-0 flex-col items-center justify-between gap-1 self-stretch border-l border-border/40 p-4 sm:w-[160px] md:w-[180px]">
            <PriceDisplay
              amount={Number(plan.DuePremium)}
              currency={currency || plan.Currency || 'PHP'}
              label="Premium"
            />
            <div className="flex w-full flex-col items-center gap-1">
              <PrimaryActionButton
                size="sm"
                className="h-8 w-full px-4 text-xs font-semibold"
                disabled={!isAvailable}
                onClick={handleAction}
              >
                Apply Now
              </PrimaryActionButton>
              {redirectUrl && (
                <span className="text-muted-foreground text-center text-[10px]">
                  via Pacific Cross secure site
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ EXPANDED: full category detail ══════════════════════════ */}
        {expanded && categories.length > 0 && (
          <div className="p-3 sm:p-4">
            {(() => {
              const mid = Math.ceil(categories.length / 2)
              const left = categories.slice(0, mid)
              const right = categories.slice(mid)
              return (
                <div className="flex gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0 space-y-4">
                    {left.map((cat) => <CategorySection key={cat.key} category={cat} />)}
                  </div>
                  {right.length > 0 && (
                    <div className="flex-1 min-w-0 space-y-4">
                      {right.map((cat) => <CategorySection key={cat.key} category={cat} />)}
                    </div>
                  )}
                </div>
              )
            })()}
            {redirectUrl && (
              <p className="text-muted-foreground mt-3 text-center text-[10px]">
                via Pacific Cross secure site
              </p>
            )}
          </div>
        )}

        {/* ══════════ EXPAND TOGGLE ════════════════════════════════════════════ */}
        {categories.length > 0 && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-white px-4 py-1 text-xs font-medium text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-muted/50 hover:text-primary dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors"
            >
              {expanded ? (
                <>View less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>View {totalBenefits} benefits <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
