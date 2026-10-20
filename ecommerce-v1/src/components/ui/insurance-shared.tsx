'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Shared UI components for all insurance product pages (Travel, Health, Motor).
 * Ensures consistent styling across the ecommerce portal.
 */

// ─── Primary Action Button (gradient, rounded-full) ──────────────────────────
interface PrimaryActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PrimaryActionButton({ children, size = 'md', className, ...props }: PrimaryActionButtonProps) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-10 px-6 text-sm sm:h-12',
    lg: 'h-12 px-8 text-base',
  }

  return (
    <button
      type="button"
      className={cn(
        'rounded-full from-primary to-lilac bg-gradient-to-r font-medium text-primary-foreground shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Plan Card Skeleton (loading state for plan cards) ────────────────────────
// Mirrors the plan card's responsive structure: vertically stacked on mobile
// (< sm), 3-panel row on desktop.
export function PlanCardSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border">
      {/* Mobile: stacked skeleton matching the real card's rows */}
      <div className="flex flex-col gap-3 p-4 sm:hidden">
        {/* Logo tile (centered) */}
        <div className="flex h-14 items-center justify-center rounded-lg border border-border py-2">
          <Skeleton className="h-10 w-36 min-[390px]:h-12" />
        </div>
        {/* Plan name + price (centered pair) */}
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        {/* Headline coverage chip */}
        <Skeleton className="mx-auto h-6 w-36 rounded-full" />
        {/* Key benefit rows */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        {/* Accordion toggle */}
        <Skeleton className="h-11 w-full rounded-full" />
        {/* Apply Now CTA + caption */}
        <div className="space-y-1.5">
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="mx-auto h-3 w-36" />
        </div>
      </div>
      {/* Desktop: 3-panel row */}
      <div className="hidden w-full sm:flex">
        <Skeleton className="w-[160px] md:w-[180px] h-[120px] rounded-none" />
        <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 gap-3">
          <Skeleton className="h-5 w-[55%]" />
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
            <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
            <div><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-3 w-24" /></div>
          </div>
        </div>
        <div className="flex w-[160px] md:w-[180px] shrink-0 flex-col items-center justify-center border-l p-4 gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-8 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Plans Loading State ──────────────────────────────────────────────────────
export function PlansLoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 py-8">
      {Array.from({ length: count }).map((_, i) => (
        <PlanCardSkeleton key={i} />
      ))}
      <p className="text-muted-foreground text-center text-sm">
        Searching for the best plans for you...
      </p>
    </div>
  )
}

// ─── Price Display (PHP amount + label, inline) ───────────────────────────────
interface PriceDisplayProps {
  amount: number
  currency?: string
  label?: string
  className?: string
}

export function PriceDisplay({ amount, currency = 'PHP', label = 'Premium', className }: PriceDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-primary text-xs font-semibold">{currency}</span>
        <span className="text-foreground text-xl font-black tabular-nums sm:text-2xl">
          {amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
    </div>
  )
}

// ─── Sort Filter Sidebar ──────────────────────────────────────────────────────
interface SortOption {
  key: string
  label: string
}

interface FilterProvider {
  code: string
  name: string
  isActive: boolean
}

interface SortFilterSidebarProps {
  sortOptions: SortOption[]
  currentSort: string
  onSortChange: (key: string) => void
  providers?: FilterProvider[]
  onProviderToggle?: (code: string) => void
  coverages?: string[]
}

export function SortFilterSidebar({
  sortOptions,
  currentSort,
  onSortChange,
  providers,
  onProviderToggle,
  coverages,
}: SortFilterSidebarProps) {
  return (
    <aside className="hidden w-[200px] shrink-0 lg:block">
      <div className="sticky top-4 space-y-6">
        {/* Sorted by */}
        <div>
          <h4 className="text-foreground mb-2 text-sm font-bold">Sorted by</h4>
          <ul className="space-y-1.5">
            {sortOptions.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => onSortChange(option.key)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className={`h-2.5 w-2.5 rounded-full border ${currentSort === option.key ? 'border-success bg-success' : 'border-input bg-background'}`} />
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* By providers */}
        {providers && providers.length > 0 && (
          <div>
            <h4 className="text-foreground mb-2 text-sm font-bold">By providers</h4>
            <ul className="space-y-1.5">
              {providers.map((provider) => (
                <li key={provider.code}>
                  <button
                    type="button"
                    onClick={() => onProviderToggle?.(provider.code)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full border ${provider.isActive ? 'border-success bg-success' : 'border-input bg-background'}`} />
                    {provider.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* By coverages */}
        {coverages && coverages.length > 0 && (
          <div>
            <h4 className="text-foreground mb-2 text-sm font-bold">By coverages</h4>
            <ul className="space-y-1.5">
              {coverages.map((coverage) => (
                <li key={coverage} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
                  <span className="line-clamp-2">{coverage}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Section Description (regular text, not gray) ─────────────────────────────
export function SectionDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-foreground', className)}>
      {children}
    </p>
  )
}

// ─── No Plans Available State ─────────────────────────────────────────────────
interface NoPlanStateProps {
  title?: string
  message?: string
  onModifySearch?: () => void
}

export function NoPlanState({
  title = 'No Plans Available',
  message = 'No insurance plans are available for your selected criteria. Please try different details or contact your agent for assistance.',
  onModifySearch,
}: NoPlanStateProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        {onModifySearch && (
          <button
            onClick={onModifySearch}
            className="rounded-full bg-muted px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/70"
          >
            Edit search
          </button>
        )}
      </div>
    </div>
  )
}
