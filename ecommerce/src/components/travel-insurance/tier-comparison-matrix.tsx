'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { PriceDisplay, PrimaryActionButton } from '@/components/ui/insurance-shared'
import {
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
  ChevronRight,
  X,
  RotateCcw,
  Info,
} from 'lucide-react'
import Image from 'next/image'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import {
  CANONICAL_CATEGORY_ORDER,
  getComparisonRowConfigs,
  groupBenefitsByCanonical,
  resolveLimitDisplay,
  type CategoryConfig,
} from '@/utils/travel-benefits-helpers'
import type { InsurancePlan, InsuranceBenefit } from '@/types/plan'

// ─── Icon map ─────────────────────────────────────────────────────────────────

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

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatAmount(value: string) {
  const n = Number(value)
  if (Number.isNaN(n)) return value
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return n.toLocaleString('en-PH', { maximumFractionDigits: 0 })
}

function currencySymbol(currency?: string) {
  if (!currency || currency === 'PHP') return '₱'
  if (currency === 'USD') return '$'
  if (currency === 'EUR') return '€'
  return `${currency} `
}

// ─── Portal popover ───────────────────────────────────────────────────────────
// Rendered via portal into document.body so no overflow ancestor can clip it.

interface BenefitPopoverProps {
  benefits: InsuranceBenefit[]
  currency?: string
  children: React.ReactNode
}

function BenefitPopover({ benefits, currency, children }: BenefitPopoverProps) {
  const [style, setStyle] = useState<React.CSSProperties | null>(null)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')
  const triggerRef = useRef<HTMLDivElement>(null)
  const POPOVER_W = 272

  const show = useCallback(() => {
    if (!benefits.length || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const above = r.top
    const below = window.innerHeight - r.bottom
    const place: 'top' | 'bottom' = above >= 200 || above > below ? 'top' : 'bottom'

    let left = r.left + r.width / 2 - POPOVER_W / 2
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_W - 8))

    setPlacement(place)
    setStyle(
      place === 'top'
        ? { bottom: window.innerHeight - r.top + 8, left, width: POPOVER_W }
        : { top: r.bottom + 8, left, width: POPOVER_W }
    )
  }, [benefits.length])

  const hide = useCallback(() => setStyle(null), [])

  if (!benefits.length) return <>{children}</>

  return (
    <>
      <div ref={triggerRef} className="cursor-help" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
        {children}
      </div>

      {style &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] rounded-xl border border-border/60 bg-popover p-3 shadow-2xl"
            style={style}
          >
            {/* Arrow */}
            <div
              className={cn(
                'absolute left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 border bg-popover border-border/60',
                placement === 'top'
                  ? 'top-full -mt-[6px] border-t-0 border-l-0'
                  : 'bottom-full mb-[-6px] border-b-0 border-r-0'
              )}
            />
            <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3 shrink-0" /> Benefit Details
            </p>
            <ul className="space-y-1.5">
              {benefits.map((b, i) => {
                const display = resolveLimitDisplay(b)
                const fallbackDesc =
                  b.DefaultLimitDesc && b.DefaultLimitDesc !== '0' ? b.DefaultLimitDesc : null
                let limitText = fallbackDesc || b.Silimit || '—'
                if (display.kind === 'amount') limitText = `${currencySymbol(currency)}${formatAmount(display.value)}`
                else if (display.kind === 'badge') limitText = display.label
                else if (display.kind === 'text') limitText = display.text
                return (
                  <li key={i} className="flex items-start justify-between gap-3 text-xs">
                    <span className="leading-tight text-foreground/80">{b.BenefitDesc}</span>
                    <span className="shrink-0 font-semibold text-foreground">{limitText}</span>
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  )
}

// ─── Cell value ───────────────────────────────────────────────────────────────

function CellValue({ benefits, currency }: { benefits: InsuranceBenefit[]; currency?: string }) {
  if (!benefits || benefits.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  const sorted = [...benefits].sort((a, b) => {
    const rank = (d: ReturnType<typeof resolveLimitDisplay>) =>
      d.kind === 'amount' ? Number(d.value) : d.kind === 'badge' || d.kind === 'text' ? 9_999_999 : -1
    return rank(resolveLimitDisplay(b)) - rank(resolveLimitDisplay(a))
  })
  const top = sorted[0]
  const display = resolveLimitDisplay(top)
  const remaining = benefits.length - 1

  const summary =
    display.kind === 'amount' ? (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-foreground text-sm font-bold tabular-nums whitespace-nowrap">
          {currencySymbol(currency)}{formatAmount(display.value)}
        </span>
        {remaining > 0 && <span className="text-muted-foreground text-[10px]">+{remaining} more</span>}
      </div>
    ) : display.kind === 'badge' ? (
      <div className="flex flex-col items-center gap-0.5">
        <span className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none',
          display.label.toLowerCase() === 'unlimited'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
            : display.label.toLowerCase() === 'included'
              ? 'bg-success/10 text-success dark:bg-green-950 dark:text-green-300'
              : 'bg-muted text-muted-foreground'
        )}>
          {display.label.toLowerCase() === 'unlimited'
            ? <Infinity className="h-3 w-3" />
            : <CheckCircle2 className="h-3 w-3" />}
          {display.label}
        </span>
        {remaining > 0 && <span className="text-muted-foreground text-[10px]">+{remaining} more</span>}
      </div>
    ) : display.kind === 'text' ? (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-foreground text-[11px] font-medium leading-tight">
          {display.text}
        </span>
        {remaining > 0 && <span className="text-muted-foreground text-[10px]">+{remaining} more</span>}
      </div>
    ) : (
      <div className="text-center">
        <span className="text-muted-foreground text-xs">—</span>
        {remaining > 0 && <span className="block text-[10px] text-muted-foreground">+{remaining} more</span>}
      </div>
    )

  return (
    <BenefitPopover benefits={benefits} currency={currency}>
      {summary}
    </BenefitPopover>
  )
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TierComparisonPlan {
  CarrierCode: string
  Plan: InsurancePlan
  IsExternalLink?: string
  RedirectUrl?: string
  [k: string]: any
}

interface TierComparisonMatrixProps {
  plans: TierComparisonPlan[]
  selectedPlan?: string
  isAvailable?: boolean
  onSelectPlan: (plan: InsurancePlan, carrierCode: string) => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TierComparisonMatrix({
  plans,
  selectedPlan,
  isAvailable = true,
  onSelectPlan,
}: TierComparisonMatrixProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())

  const rowConfigs: CategoryConfig[] = useMemo(() => {
    const planObjs = plans.map((p) => p.Plan)
    const cfg = getComparisonRowConfigs(planObjs)
    return cfg.length ? cfg : CANONICAL_CATEGORY_ORDER
  }, [plans])

  const planMaps = useMemo(() => {
    return plans.map((p, idx) => {
      const code = (p.Plan as any)?.CarrierPlanCode || (p.Plan as any)?.CarrierPlanDesc || `plan-${idx}`
      return {
        key: `${p.CarrierCode}-${code}-${idx}`,
        carrierCode: p.CarrierCode,
        plan: p.Plan,
        redirectUrl: p.IsExternalLink === 'Y' ? p.RedirectUrl : undefined,
        currency: (p.Plan as any).Currency || 'PHP',
        map: groupBenefitsByCanonical(p.Plan),
      }
    })
  }, [plans])

  const visiblePlanMaps = useMemo(() => planMaps.filter((p) => !hiddenKeys.has(p.key)), [planMaps, hiddenKeys])
  const hiddenPlanMaps = useMemo(() => planMaps.filter((p) => hiddenKeys.has(p.key)), [planMaps, hiddenKeys])

  const hideColumn = useCallback((key: string) => setHiddenKeys((p) => new Set([...p, key])), [])
  const restoreColumn = useCallback((key: string) => {
    setHiddenKeys((p) => { const n = new Set(p); n.delete(key); return n })
  }, [])
  const restoreAll = useCallback(() => setHiddenKeys(new Set()), [])

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const right = scrollWidth > clientWidth + 4 && scrollLeft < scrollWidth - clientWidth - 8
    setCanScrollRight(right)
    setCanScrollLeft(scrollLeft > 8)
    setShowHint(right)
  }

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    const t = setTimeout(updateScrollState, 500)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      clearTimeout(t)
    }
  }, [visiblePlanMaps.length, rowConfigs.length])

  const scrollByAmount = (dir: number) => scrollRef.current?.scrollBy({ left: dir, behavior: 'smooth' })

  if (!plans.length) return null

  const colCount = visiblePlanMaps.length
  const gridCols = `200px repeat(${colCount}, minmax(200px, 240px))`

  return (
    <div className="relative w-full max-w-full overflow-hidden space-y-3">
      {/* Restore bar */}
      {hiddenPlanMaps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Hidden:</span>
          {hiddenPlanMaps.map(({ key, plan }) => (
            <button
              key={key}
              type="button"
              onClick={() => restoreColumn(key)}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3 w-3 text-primary" />
              {plan.CarrierPlanDesc}
            </button>
          ))}
          <button type="button" onClick={restoreAll} className="ml-auto text-xs text-primary hover:underline">
            Restore all
          </button>
        </div>
      )}

      {/* Table card — w-full/max-w-full + overflow-hidden isolates scrollbar to this card */}
      <Card className="relative w-full max-w-full gap-0 overflow-hidden border-border/60 py-0">
        {/* Fade indicators */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-[200px] z-20 hidden w-8 bg-gradient-to-r from-background to-transparent sm:block" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-10 bg-gradient-to-l from-background via-background/80 to-transparent sm:block" />
        )}

        {/* Horizontal scroll only — no height constraint, no vertical scrollbar. Isolated to this card via parent overflow-hidden + min-w-0 on flex wrapper. */}
        <div
          ref={scrollRef}
          className="w-full max-w-full overflow-x-auto overscroll-x-contain rounded-xl"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
          }}
        >
          <div className="min-w-max">
            {/* Header — sticky inside the scroll container */}
            <div
              className="grid sticky top-0 z-30 border-b border-border/60 bg-muted"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div className="sticky left-0 z-40 flex items-center gap-2 border-r border-border/40 bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-[4px_0_8px_rgba(0,0,0,0.06)]">
                Coverage
              </div>

              {visiblePlanMaps.map(({ key, carrierCode, plan, currency, redirectUrl }) => {
                const provider = COMPANIES.find((c) => c.carrierCode === carrierCode)
                const brand = CARRIER_BRAND_COLORS[carrierCode] || { bg: '#374151', text: '#fff' }
                const logoSrc = (brand as any).planCardLogo || provider?.image
                const isSelected = selectedPlan && plan.CarrierPlanCode ? selectedPlan === plan.CarrierPlanCode : false
                return (
                  <div
                    key={key}
                    className={cn(
                      'relative flex flex-col items-center gap-2 border-r border-border/40 bg-background px-4 pb-7 pt-5 text-center last:border-r-0',
                      isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/30'
                    )}
                  >
                    {/* Hide button */}
                    <button
                      type="button"
                      aria-label={`Hide ${plan.CarrierPlanDesc}`}
                      onClick={() => hideColumn(key)}
                      className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {/* Logo — same max-h for all providers */}
                    <div className="flex h-20 w-full shrink-0 items-center justify-center px-2">
                      {logoSrc ? (
                        <Image
                          src={logoSrc}
                          alt={provider?.companyName || carrierCode}
                          width={160}
                          height={80}
                          className="max-h-16 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-sm font-bold uppercase tracking-wide">{carrierCode}</span>
                      )}
                    </div>

                    {/* Plan name — flex-1 so premium/button block is always pushed to the same bottom position */}
                    <div className="flex min-h-[3.25rem] w-full flex-1 items-center justify-center">
                      <p
                        title={plan.CarrierPlanDesc}
                        className="w-full break-words text-balance text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-foreground"
                      >
                        {plan.CarrierPlanDesc}
                      </p>
                    </div>

                    {/* Price + Apply Now — mt-auto keeps this block at a fixed bottom distance */}
                    <div className="mt-auto flex w-full flex-col items-center gap-1">
                      <PriceDisplay amount={Number(plan.DuePremium)} currency={currency} label="Premium" />

                      <PrimaryActionButton
                        size="sm"
                        className="mt-1 h-8 w-full px-3 text-xs font-semibold"
                        disabled={!isAvailable}
                        onClick={() => {
                          if (redirectUrl) window.open(redirectUrl, '_blank')
                          else onSelectPlan(plan, carrierCode)
                        }}
                      >
                        Apply Now
                      </PrimaryActionButton>
                    </div>

                    {/* "via …" note — absolute so it never shifts the button up */}
                    {redirectUrl && (
                      <span className="absolute bottom-1.5 left-0 w-full text-center text-muted-foreground text-[9px] px-2">
                        via Pacific Cross secure site
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Body rows — sticky label column is fully opaque solid so scrolling columns don't bleed through */}
            {rowConfigs.map((cfg, rowIdx) => (
              <div
                key={cfg.label}
                className={cn('grid border-b border-border/30 last:border-b-0', rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted')}
                style={{ gridTemplateColumns: gridCols }}
              >
                <div
                  className={cn(
                    'sticky left-0 z-10 flex items-center gap-2 border-r border-border/40 px-4 py-3 text-left shadow-[4px_0_8px_rgba(0,0,0,0.06)]',
                    rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted'
                  )}
                >
                  <CategoryIcon name={cfg.icon} className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-xs font-semibold leading-tight text-foreground">{cfg.label}</span>
                </div>

                {visiblePlanMaps.map(({ key, map, currency }) => {
                  const benefits = map.get(cfg.label) || []
                  return (
                    <div
                      key={`${key}-${cfg.label}`}
                      className="flex min-h-[56px] items-center justify-center border-r border-border/30 px-2 py-3 last:border-r-0"
                    >
                      <CellValue benefits={benefits} currency={currency} />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-muted/20 px-3 py-2 text-xs rounded-b-xl">
          <span className="text-muted-foreground hidden items-center gap-1 sm:flex">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-white text-muted-foreground shadow-sm">↔</span>
            Scroll to compare plans
          </span>
          <span className="text-muted-foreground flex items-center gap-1 sm:hidden">
            Swipe to compare <ChevronRight className="h-3 w-3" />
          </span>
          <div className="flex items-center gap-2">
            {showHint && (
              <span className="bg-primary animate-pulse rounded-full px-3 py-1 text-xs font-medium text-white shadow">
                More plans →
              </span>
            )}
            <div className="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollByAmount(-280)}
                disabled={!canScrollLeft}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white text-sm shadow-sm hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-900"
              >‹</button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollByAmount(280)}
                disabled={!canScrollRight}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white text-sm shadow-sm hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-900"
              >›</button>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-muted-foreground mt-2 text-center text-xs">
        Categories normalized across providers. Hover a cell to see full benefit breakdown.
      </p>
    </div>
  )
}
