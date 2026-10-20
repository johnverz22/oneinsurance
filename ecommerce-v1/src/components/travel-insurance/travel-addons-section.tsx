'use client'

import { useId, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Info,
  Mountain,
  Ship,
  ShieldPlus,
  Syringe,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { InsuranceBenefit } from '@/types/plan'
import { LimitBadge } from './insurance-plan'

// ─── icon resolver ────────────────────────────────────────────────────────────
// Keyed by the add-on's category (case-insensitive) — falls back to a generic
// shield icon for categories we haven't mapped yet (new add-on types from
// insurers land here automatically, just without a bespoke icon).
const ADDON_ICON_MAP: Record<string, React.ElementType> = {
  'cruise cover': Ship,
  'sports equipment': Dumbbell,
  'hazardous sports': Mountain,
  'covid-19 coverage': Syringe,
}

function AddonIcon({ category, className }: { category: string; className?: string }) {
  const Icon = ADDON_ICON_MAP[category.toLowerCase().trim()] ?? ShieldPlus
  return <Icon className={className} aria-hidden />
}

// ─── one add-on group card ────────────────────────────────────────────────────

const COLLAPSED_BENEFIT_COUNT = 3

function AddonCard({
  code,
  category,
  benefits,
  isSelected,
  onToggle,
  currency,
}: {
  code: string
  category: string
  benefits: InsuranceBenefit[]
  isSelected: boolean
  onToggle: (checked: boolean) => void
  currency?: string
}) {
  const switchId = useId()
  const [expanded, setExpanded] = useState(false)
  const hasMore = benefits.length > COLLAPSED_BENEFIT_COUNT
  const visibleBenefits = expanded ? benefits : benefits.slice(0, COLLAPSED_BENEFIT_COUNT)

  return (
    <Card
      variant="default"
      className={cn(
        'gap-3 p-4 transition-colors motion-reduce:transition-none sm:p-5',
        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border/60'
      )}
    >
      {/* Header: icon + title + toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
            )}
          >
            <AddonIcon category={category} className="size-5" />
          </span>
          <Label
            htmlFor={switchId}
            className="min-w-0 cursor-pointer text-sm font-semibold text-foreground sm:text-base"
          >
            {category}
          </Label>
        </div>
        <Switch
          id={switchId}
          checked={isSelected}
          onCheckedChange={onToggle}
          aria-label={`Add ${category} to trip`}
          className="mt-1 shrink-0"
        />
      </div>

      {/* Included coverages */}
      <ul className="space-y-1.5">
        {visibleBenefits.map((benefit, i) => (
          <li key={`${benefit.BenefitCode}-${i}`} className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">{benefit.BenefitDesc}</span>
            </span>
            <span className="shrink-0 text-right">
              <LimitBadge benefit={benefit} currency={currency} />
            </span>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="focus-visible:ring-ring inline-flex min-h-8 items-center gap-1 self-start rounded-full text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2"
        >
          {expanded ? (
            <>Show less <ChevronUp className="size-3.5" aria-hidden /></>
          ) : (
            <>+{benefits.length - COLLAPSED_BENEFIT_COUNT} more benefit{benefits.length - COLLAPSED_BENEFIT_COUNT > 1 ? 's' : ''} <ChevronDown className="size-3.5" aria-hidden /></>
          )}
        </button>
      )}
    </Card>
  )
}

// ─── section ──────────────────────────────────────────────────────────────────

export interface AddonGroup {
  code: string
  category: string
  benefits: InsuranceBenefit[]
}

interface TravelAddonsSectionProps {
  groups: AddonGroup[]
  selected: string[]
  onToggle: (code: string, checked: boolean) => void
  currency?: string
}

export function TravelAddonsSection({
  groups,
  selected,
  onToggle,
  currency,
}: TravelAddonsSectionProps) {
  if (!groups.length) return null

  return (
    <div className="border-t-muted-foreground/10 space-y-4 border-t px-5 py-6 sm:px-6">
      <div>
        <h2 className="text-primary text-lg font-semibold sm:text-xl">Optional add-ons</h2>
        <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-xs sm:text-sm">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Switch on any extra protection you'd like — your updated total is calculated
          when your quote is created in the next step. The premium shown reflects the base plan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => (
          <AddonCard
            key={group.code}
            code={group.code}
            category={group.category}
            benefits={group.benefits}
            isSelected={selected.includes(group.code)}
            onToggle={(checked) => onToggle(group.code, checked)}
            currency={currency}
          />
        ))}
      </div>
    </div>
  )
}
