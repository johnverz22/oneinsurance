'use client'

import { useId, useState } from 'react'
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
  ShieldCheck,
  CheckCircle2,
  Infinity,
  FileText,
  Check,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PriceDisplay, PrimaryActionButton } from '@/components/ui/insurance-shared'
import {
  groupBenefitsByCategory,
  getCanonicalConfigForBenefit,
  resolveLimitDisplay,
  BenefitCategory,
} from '@/utils/travel-benefits-helpers'
import { InsuranceBenefit, InsurancePlan } from '@/types/plan'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import { formatForeign, formatFreeTextMoney, formatPHP, formatPHPCompact, toPHP } from '@/utils/fx'
import { formatDays, formatTravelers, getTripDays } from '@/utils/trip-summary'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
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
  Circle: ShieldCheck,
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? ShieldCheck
  return <Icon className={className} aria-hidden />
}

// ─── insurer logo ─────────────────────────────────────────────────────────────

/**
 * Intrinsic dimensions for the pre-trimmed `cardLogoTight` rasters (see
 * constants/companies.ts) so next/image gets the real aspect ratio instead of
 * a guessed one. Carriers without a tight asset fall back to a neutral ratio
 * — their un-trimmed source still renders, just not as large.
 */
const CARD_LOGO_INTRINSIC: Record<string, { width: number; height: number }> = {
  MALAYAN: { width: 900, height: 211 },
  OONAPH: { width: 900, height: 341 },
  PACIFIC: { width: 900, height: 900 },
}

/**
 * Logo slot used by the mobile plan card: object-contain, left-aligned, never
 * upscaled past its natural size. Falls back to the insurer's name as
 * 16px/600 text if the image fails to load, so the card never shows a blank
 * gap.
 */
function InsurerLogo({
  src,
  name,
  intrinsic,
  className,
}: {
  src?: string
  name: string
  intrinsic: { width: number; height: number }
  className?: string
}) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <span className={cn('text-foreground inline-block text-base font-semibold', className)}>
        {name}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={intrinsic.width}
      height={intrinsic.height}
      quality={90}
      sizes="150px"
      className={cn('object-contain object-center', className)}
      onError={() => setErrored(true)}
    />
  )
}

// ─── limit helpers ────────────────────────────────────────────────────────────

/**
 * Badge/text limit labels sometimes carry a bare money amount instead of a
 * structured one (e.g. Oona's "Up to 1,000,000" note). Route it through the
 * same PHP formatter as every other amount on the card ("Up to ₱1,000,000"),
 * but leave reserved keywords and already-tagged amounts untouched.
 */
function formatBadgeLabel(label: string): string {
  const lower = label.toLowerCase()
  if (lower === 'unlimited' || lower === 'included') return label
  return formatFreeTextMoney(label)
}

/**
 * Resolves a benefit's limit to a comparable PHP amount + display string,
 * regardless of whether the insurer sent a structured amount or stuffed a
 * bare number into a free-text note/label (e.g. Oona's "Up to 1,000,000").
 * Used to pick the headline coverage metric and its largest-coverage
 * fallback — every insurer needs a comparable "biggest number" even when
 * none of their limits are the structured `amount` kind.
 */
function benefitHeadlineValue(
  benefit: InsuranceBenefit,
  currency: string
): { amountPHP: number; display: string } | null {
  const display = resolveLimitDisplay(benefit)
  if (display.kind === 'amount') {
    const amt = toPHP(Number(display.value), currency)
    return { amountPHP: amt, display: formatPHPCompact(amt) }
  }
  if (display.kind === 'badge' || display.kind === 'text') {
    // Free-text notes carry a bare number with no currency marker — these
    // are already PHP-denominated (unlike structured `amount`), so they're
    // formatted as-is rather than run through the FX map.
    const label = display.kind === 'badge' ? display.label : display.text
    const lower = label.toLowerCase()
    if (lower === 'unlimited') return { amountPHP: Number.POSITIVE_INFINITY, display: 'Unlimited' }
    if (lower === 'included') return null
    const match = label.replace(/,/g, '').match(/\d{3,}/)
    if (match) {
      const amt = Number(match[0])
      return { amountPHP: amt, display: formatPHPCompact(amt) }
    }
  }
  return null
}

/** Best (benefit, value) pair within a single category, by comparable PHP amount. */
function pickBestInCategory(category: BenefitCategory, currency: string) {
  let best: { benefit: InsuranceBenefit; value: { amountPHP: number; display: string } } | null = null
  for (const benefit of category.benefits) {
    const value = benefitHeadlineValue(benefit, currency)
    if (!value) continue
    if (!best || value.amountPHP > best.value.amountPHP) best = { benefit, value }
  }
  return best
}

function formatLimitShort(
  benefit: InsuranceBenefit,
  currency = 'PHP'
): string | null {
  const display = resolveLimitDisplay(benefit)
  if (display.kind === 'amount') {
    const n = toPHP(Number(display.value), currency)
    return formatPHPCompact(n)
  }
  if (display.kind === 'badge') return formatBadgeLabel(display.label)
  if (display.kind === 'text') return formatFreeTextMoney(display.text)
  return null
}

export function LimitBadge({
  benefit,
  currency = 'PHP',
}: {
  benefit: InsuranceBenefit
  currency?: string
}) {
  const display = resolveLimitDisplay(benefit)

  if (display.kind === 'amount') {
    return (
      <span className="text-foreground text-sm font-bold tabular-nums whitespace-nowrap">
        {formatPHP(toPHP(Number(display.value), currency))}
      </span>
    )
  }

  if (display.kind === 'badge') {
    const isUnlimited = display.label.toLowerCase() === 'unlimited'
    return (
      <span className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none',
        isUnlimited
          ? 'bg-primary/10 text-primary'
          : 'bg-success/10 text-success'
      )}>
        {isUnlimited ? <Infinity className="h-2.5 w-2.5" aria-hidden /> : <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />}
        {formatBadgeLabel(display.label)}
      </span>
    )
  }

  if (display.kind === 'text') {
    // Longer free-text limits (e.g. "Travel cost plus up to Php 5,000/day…")
    // don't fit a chip — render as wrapped text, capped so the row stays sane
    return (
      <span className="text-foreground inline-block max-w-36 text-xs font-medium leading-tight wrap-anywhere">
        {formatFreeTextMoney(display.text)}
      </span>
    )
  }

  return <span className="text-muted-foreground text-xs">—</span>
}

// ─── collapsed: 3-column benefit snapshot (desktop) ───────────────────────────

function CollapsedBenefits({
  categories,
  currency,
}: {
  categories: BenefitCategory[]
  currency: string
}) {
  // Pick the top benefit from each category — max 6 to fit 2 rows of 3
  const highlights = topBenefitPerCategory(categories, 6)

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
      {highlights.map(({ cat, benefit }, i) => {
        const limitStr = formatLimitShort(benefit, currency)
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
                isUnlimited ? 'text-primary' :
                isIncluded  ? 'text-success' :
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

// ─── shared: top benefit per category ────────────────────────────────────────

function topBenefitPerCategory(categories: BenefitCategory[], max: number) {
  return categories.slice(0, max).map((cat) => ({
    cat,
    benefit: cat.benefits.reduce((best, b) =>
      Number(b.Silimit ?? 0) > Number(best.Silimit ?? 0) ? b : best
    , cat.benefits[0]),
  }))
}

// ─── mobile: single-column benefit row (icon + label | value) ────────────────

function BenefitRow({
  icon,
  benefit,
  currency,
}: {
  icon: string
  benefit: InsuranceBenefit
  currency: string
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_max-content] items-start gap-x-2">
      <CategoryIcon
        name={icon}
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <span className="text-foreground min-w-0 text-sm leading-snug">
        {benefit.BenefitDesc}
        {benefit.LimitModeDesc && (
          <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs italic">
            {formatFreeTextMoney(benefit.LimitModeDesc)}
          </span>
        )}
      </span>
      <span className="min-w-0 text-right">
        <LimitBadge benefit={benefit} currency={currency} />
      </span>
    </li>
  )
}

// ─── expanded: 2-column category detail (desktop) ────────────────────────────

function CategorySection({ category, currency }: { category: BenefitCategory; currency: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <CategoryIcon name={category.config.icon} className="h-3 w-3 text-primary shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {category.config.label}
        </span>
      </div>
      <div className="space-y-0.5">
        {category.benefits.map((benefit, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-2 rounded px-2 py-0.5 odd:bg-muted/30"
          >
            <span className="text-muted-foreground text-xs leading-snug flex-1 min-w-0">
              {benefit.BenefitDesc}
              {benefit.LimitModeDesc && (
                <span className="block text-xs text-muted-foreground mt-0.5 italic">
                  {benefit.LimitModeDesc}
                </span>
              )}
            </span>
            <div className="shrink-0 min-w-0 text-right">
              <LimitBadge benefit={benefit} currency={currency} />
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
  /** Mobile compare checkbox state */
  compareChecked?: boolean
  onCompareChange?: (checked: boolean) => void
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
  compareChecked = false,
  onCompareChange,
}: TravelInsurancePlanProps) {
  const [expanded, setExpanded] = useState(false)
  const benefitsId = useId()

  const categories = groupBenefitsByCategory(plan)
  const totalBenefits = categories.reduce((s, c) => s + c.benefits.length, 0)

  const isSelected = selectedPlan && plan.CarrierPlanCode
    ? selectedPlan === plan.CarrierPlanCode
    : false

  const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
  const insurerName = provider?.companyName || carrierCode
  const brandColors = CARRIER_BRAND_COLORS[carrierCode] || { bg: '#374151', text: '#ffffff', invertLogo: false }
  const logoSrc = brandColors.planCardLogo || provider?.image
  const cardLogoSrc = brandColors.cardLogoTight || logoSrc
  const cardLogoIntrinsic = CARD_LOGO_INTRINSIC[carrierCode] ?? { width: 150, height: 48 }
  const hasBrochure = carrierCode === 'PACIFIC'

  const planCurrency = currency || plan.Currency || 'PHP'
  const premium = Number(plan.DuePremium)
  const premiumPHP = toPHP(premium, planCurrency)

  const travelDetails = useTravelInsuranceStore((s) => s.travelDetails)
  const tripDays = getTripDays(travelDetails.departureDate, travelDetails.returnDate)

  // Headline coverage chip — always the medical expense limit so every card
  // shows the same metric. Benefits are matched by canonical inference
  // (not just an exact "Medical" category label) because some insurers
  // (e.g. Oona) file medical benefits under a generic/uncategorized bucket
  // with a descriptive name instead of a recognized CoverageName. If the
  // plan has no medical benefit (or none of its limits resolve to a
  // number), fall back to the single largest coverage amount across every
  // category and label it with that category's own name — amount, badge
  // ("Unlimited") and free-text ("Up to 1,000,000") limits are all
  // comparable via `benefitHeadlineValue`.
  let headline: string | null = null
  let headlineBenefit: InsuranceBenefit | null = null
  const medicalBenefits = categories
    .flatMap((cat) => cat.benefits)
    .filter((b) => getCanonicalConfigForBenefit(b).label === 'Medical')
  let medicalBest: { benefit: InsuranceBenefit; value: { amountPHP: number; display: string } } | null = null
  for (const benefit of medicalBenefits) {
    const value = benefitHeadlineValue(benefit, planCurrency)
    if (!value) continue
    if (!medicalBest || value.amountPHP > medicalBest.value.amountPHP) medicalBest = { benefit, value }
  }
  if (medicalBest) {
    headline = `Medical ${medicalBest.value.display === 'Unlimited' ? ': Unlimited' : `up to ${medicalBest.value.display}`}`
    headlineBenefit = medicalBest.benefit
  }
  if (!headline) {
    let best: { cat: BenefitCategory; benefit: InsuranceBenefit; value: { amountPHP: number; display: string } } | null = null
    for (const cat of categories) {
      const catBest = pickBestInCategory(cat, planCurrency)
      if (catBest && (!best || catBest.value.amountPHP > best.value.amountPHP)) {
        best = { cat, benefit: catBest.benefit, value: catBest.value }
      }
    }
    if (best) {
      headline = `${best.cat.config.label} ${
        best.value.display === 'Unlimited' ? ': Unlimited' : `up to ${best.value.display}`
      }`
      headlineBenefit = best.benefit
    }
  }

  // Top benefit rows (Row 5) — skip whichever one duplicates the headline
  // chip's metric so the same number never appears twice.
  const mobileHighlights = topBenefitPerCategory(categories, 5)
    .filter(({ benefit }) => benefit.BenefitCode !== headlineBenefit?.BenefitCode)
    .slice(0, 4)

  const handleAction = () => {
    if (redirectUrl) window.open(redirectUrl, '_blank')
    else onSelectPlan(plan, carrierCode)
  }

  return (
    <div className={cn('relative mb-4')}>
      <Card
        variant="interactive"
        className={cn(
          'w-full gap-0 border-border/60 py-0 transition-all duration-200 motion-reduce:transition-none hover:border-primary/30',
          isSelected && 'border-primary ring-2 ring-primary'
        )}
      >

        {/* ══════════ MOBILE: vertically stacked card (< sm) ═════════════════ */}
        <div className="flex w-full flex-col gap-3 p-4 sm:hidden">
          {/* Row 1: insurer logo, with optional compare checkbox top-right */}
          <div className="relative flex items-center justify-center rounded-lg border border-border bg-white py-2">
            <InsurerLogo
              src={cardLogoSrc}
              name={insurerName}
              intrinsic={cardLogoIntrinsic}
              className="h-10 min-[390px]:h-12 w-auto max-w-[150px] shrink-0"
            />
            {onCompareChange && (
              <button
                type="button"
                role="checkbox"
                aria-checked={compareChecked}
                aria-label={`Compare ${plan.CarrierPlanDesc}`}
                onClick={() => onCompareChange(!compareChecked)}
                className={cn(
                  'absolute top-1 right-1',
                  'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  compareChecked
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                    compareChecked ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-white',
                  )}
                >
                  {compareChecked && <Check className="size-3 text-primary-foreground" aria-hidden />}
                </span>
              </button>
            )}
          </div>

          {/* Rows 2–3: plan name + price, centered as a pair */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h3 className="text-foreground text-base leading-snug font-semibold line-clamp-2">
              {plan.CarrierPlanDesc}
            </h3>
            <div>
              <p className="text-foreground text-2xl leading-tight font-black tabular-nums">
                {formatPHP(premiumPHP)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                total · {formatDays(tripDays)} ·{' '}
                {formatTravelers(travelDetails.noOfAdults, travelDetails.noOfChildren)}
                {planCurrency.toUpperCase() !== 'PHP' && (
                  <> · {formatForeign(premium, planCurrency)}</>
                )}
              </p>
            </div>
          </div>

          {/* Row 4: headline coverage chip */}
          {headline && (
            <div className="flex justify-center">
              <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold">
                {headline}
              </span>
            </div>
          )}

          {/* Row 5: top key benefits — single-column list, labels never truncate */}
          {mobileHighlights.length > 0 && (
            <ul className="space-y-1.5">
              {mobileHighlights.map(({ cat, benefit }, i) => (
                <BenefitRow
                  key={i}
                  icon={cat.config.icon}
                  benefit={benefit}
                  currency={planCurrency}
                />
              ))}
            </ul>
          )}

          {/* Row 6 footer: benefits accordion toggle (44px target, in-flow) + brochure link */}
          {(categories.length > 0 || hasBrochure) && (
            <div className="flex items-center gap-2">
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  aria-expanded={expanded}
                  aria-controls={`${benefitsId}-mobile`}
                  className={cn(
                    'border-border text-foreground hover:border-primary/40 hover:text-primary focus-visible:ring-ring motion-safe:transition-colors inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-full border text-xs font-medium outline-none focus-visible:ring-2',
                    hasBrochure ? 'flex-1' : 'w-full'
                  )}
                >
                  {expanded ? (
                    <>View less <ChevronUp className="h-3.5 w-3.5" aria-hidden /></>
                  ) : (
                    <>View all {totalBenefits} benefits <ChevronDown className="h-3.5 w-3.5" aria-hidden /></>
                  )}
                </button>
              )}
              {hasBrochure && (
                <a
                  href="/pacific-cross-health-brochure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary focus-visible:ring-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium outline-none focus-visible:ring-2"
                >
                  <FileText className="size-4" aria-hidden />
                  Brochure (PDF)
                </a>
              )}
            </div>
          )}

          {/* Expanded: full benefit list, grouped by category with small section headings */}
          {expanded && categories.length > 0 && (
            <div id={`${benefitsId}-mobile`} className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.key}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <CategoryIcon name={cat.config.icon} className="text-primary size-3 shrink-0" />
                    <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      {cat.config.label}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {cat.benefits.map((benefit, i) => (
                      <BenefitRow
                        key={i}
                        icon={cat.config.icon}
                        benefit={benefit}
                        currency={planCurrency}
                      />
                    ))}
                  </ul>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="border-border text-foreground hover:border-primary/40 hover:text-primary focus-visible:ring-ring motion-safe:transition-colors inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full border text-xs font-medium outline-none focus-visible:ring-2"
              >
                Show less <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}

          {/* Row 7: full-width primary CTA in normal flow */}
          <div>
            <PrimaryActionButton
              size="md"
              className="min-h-12 w-full px-4 text-sm font-semibold"
              disabled={!isAvailable}
              onClick={handleAction}
            >
              Apply Now
            </PrimaryActionButton>
            <p className="text-muted-foreground mt-1.5 text-center text-xs">
              via {insurerName} secure site
            </p>
          </div>
        </div>

        {/* ══════════ DESKTOP: original 3-panel layout (≥ sm) ═══════════════ */}
        <div className={cn('hidden w-full min-h-[120px] sm:flex', expanded && 'border-b border-border/40')}>

          {/* Left: logo block — fixed size so card height is driven by middle column, not logo padding */}
          <div className="flex w-[120px] shrink-0 items-center justify-center overflow-hidden sm:w-[160px] md:w-[180px]">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={insurerName}
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
            <h3 className="text-foreground text-base font-bold leading-snug text-pretty sm:text-lg">
              {plan.CarrierPlanDesc}
              {hasBrochure && (
                <a
                  href="/pacific-cross-health-brochure"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-2 inline-block align-middle rounded-full border border-primary/40 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-primary hover:bg-primary/10 transition-colors"
                >
                  Brochure
                </a>
              )}
            </h3>

            {categories.length > 0 && (
              <div className="mt-3">
                <CollapsedBenefits categories={categories} currency={planCurrency} />
              </div>
            )}
          </div>

          {/* Right: price + button — self-stretch fills full row height so justify-between always splits evenly */}
          <div className="flex w-[140px] shrink-0 flex-col items-center justify-between gap-1 self-stretch border-l border-border/40 p-4 sm:w-[160px] md:w-[180px]">
            <PriceDisplay
              amount={premiumPHP}
              currency="PHP"
              label="Total"
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
                <span className="text-muted-foreground text-center text-xs">
                  via {insurerName} secure site
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ EXPANDED: full benefit list (desktop) ════════════════ */}
        {expanded && categories.length > 0 && (
          <>
            {/* Desktop: two balanced columns of category sections */}
            <div id={`${benefitsId}-desktop`} className="hidden p-3 sm:block sm:p-4">
              {(() => {
                const mid = Math.ceil(categories.length / 2)
                const left = categories.slice(0, mid)
                const right = categories.slice(mid)
                return (
                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex-1 min-w-0 space-y-4">
                      {left.map((cat) => <CategorySection key={cat.key} category={cat} currency={planCurrency} />)}
                    </div>
                    {right.length > 0 && (
                      <div className="flex-1 min-w-0 space-y-4">
                        {right.map((cat) => <CategorySection key={cat.key} category={cat} currency={planCurrency} />)}
                      </div>
                    )}
                  </div>
                )
              })()}
              {redirectUrl && (
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  via {insurerName} secure site
                </p>
              )}
            </div>
          </>
        )}

        {/* ══════════ EXPAND TOGGLE (desktop only — mobile toggle is in-flow) ═ */}
        {categories.length > 0 && (
          <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 z-10 sm:block">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={`${benefitsId}-desktop`}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-1 text-xs font-medium text-foreground shadow-sm hover:border-primary/40 hover:bg-muted hover:text-primary transition-colors"
            >
              {expanded ? (
                <>View less <ChevronUp className="h-3 w-3" aria-hidden /></>
              ) : (
                <>View {totalBenefits} benefits <ChevronDown className="h-3 w-3" aria-hidden /></>
              )}
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
