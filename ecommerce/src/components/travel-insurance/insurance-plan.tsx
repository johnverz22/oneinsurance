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
import { Button } from '@/components/ui/button'
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

/** Short formatted string for a benefit limit — used in compact chips */
function formatLimitShort(benefit: InsuranceBenefit): string | null {
  const display = resolveLimitDisplay(benefit)
  if (display.kind === 'amount') {
    const n = Number(display.value)
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    if (n >= 1_000) return `₱${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
    return `₱${n.toLocaleString('en-PH')}`
  }
  if (display.kind === 'badge') return display.label
  return null
}

/** Full badge used in the expanded detail rows */
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
          : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      )}>
        {isUnlimited ? <Infinity className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
        {display.label}
      </span>
    )
  }

  return <span className="text-muted-foreground text-xs">—</span>
}

// ─── collapsed: compact highlight chips ──────────────────────────────────────

/**
 * Picks one representative "headline" benefit per category to show as a chip.
 * Prefers the benefit with the highest numeric Silimit; falls back to first.
 */
function pickHighlight(cat: BenefitCategory): InsuranceBenefit {
  return cat.benefits.reduce((best, b) => {
    const bestN = Number(best.Silimit ?? 0)
    const bN = Number(b.Silimit ?? 0)
    return bN > bestN ? b : best
  }, cat.benefits[0])
}

function CollapsedHighlights({ categories }: { categories: BenefitCategory[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 sm:px-4">
      {categories.map((cat) => {
        const highlight = pickHighlight(cat)
        const limitStr = formatLimitShort(highlight)
        return (
          <div
            key={cat.key}
            className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-1 text-[11px]"
          >
            <CategoryIcon name={cat.config.icon} className="h-3 w-3 text-primary shrink-0" />
            <span className="text-muted-foreground">{cat.config.label}</span>
            {limitStr && (
              <>
                <span className="text-border">·</span>
                <span className={cn(
                  'font-semibold',
                  limitStr === 'Unlimited' ? 'text-blue-600 dark:text-blue-400' :
                  limitStr === 'Included' ? 'text-green-700 dark:text-green-400' :
                  'text-foreground'
                )}>
                  {limitStr}
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── expanded: full category detail grid ─────────────────────────────────────

function CategorySection({ category }: { category: BenefitCategory }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
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

  const ApplyButton = ({ className }: { className?: string }) => (
    <Button
      type="button"
      size="sm"
      className={cn(
        'rounded-full from-primary to-accent bg-gradient-to-r font-semibold text-white hover:opacity-90',
        className
      )}
      disabled={!isAvailable}
      onClick={() => {
        if (redirectUrl) window.open(redirectUrl, '_blank')
        else onSelectPlan(plan, carrierCode)
      }}
    >
      Apply Now
    </Button>
  )

  return (
    <div className="relative mb-2">
      <div
        className={cn(
          'bg-background w-full rounded-xl overflow-hidden border border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200',
          isSelected && 'ring-2 ring-primary border-primary'
        )}
      >
        {/* ══════════ CARD HEADER ═════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-border/40">
          {/* logo */}
          <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center shadow-sm">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={provider?.companyName || carrierCode}
                className={cn('h-full w-full object-contain', carrierCode === 'PACIFIC' ? 'p-1' : 'p-2')}
                width={64}
                height={40}
              />
            ) : (
              <span className="text-[10px] font-bold uppercase text-center text-foreground px-1">{carrierCode}</span>
            )}
          </div>

          {/* plan name */}
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground text-sm font-bold uppercase tracking-wide leading-snug line-clamp-1">
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
              <p className="text-muted-foreground text-[10px] mt-0.5">{provider.companyName}</p>
            )}
          </div>

          {/* price + button */}
          <div className="shrink-0 flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-muted-foreground text-[9px] uppercase tracking-wider font-medium leading-none mb-0.5">Premium</p>
              <div className="flex items-baseline gap-0.5 justify-end">
                <span className="text-primary text-[10px] font-semibold">{currency || plan.Currency || 'PHP'}</span>
                <span className="text-foreground text-lg font-black leading-none">
                  {Number(plan.DuePremium).toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <ApplyButton className="px-4 text-xs h-8" />
          </div>
        </div>

        {/* ══════════ COLLAPSED: highlight chips ══════════════════════════════ */}
        {!expanded && categories.length > 0 && (
          <CollapsedHighlights categories={categories} />
        )}

        {/* ══════════ EXPANDED: full category detail ══════════════════════════ */}
        {expanded && categories.length > 0 && (
          <div className="border-t border-border/40 p-3 sm:p-4">
            {/* Split categories into two balanced columns */}
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

        {/* ══════════ EXPAND / COLLAPSE TOGGLE ════════════════════════════════ */}
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 border-t border-border/40 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors"
          >
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Hide details</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> View {totalBenefits} benefits across {categories.length} categories</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
