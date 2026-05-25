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
        'rounded-full from-primary to-accent bg-gradient-to-r font-medium text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
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
export function PlanCardSkeleton() {
  return (
    <div className="flex w-full overflow-hidden rounded-xl border">
      <Skeleton className="w-[140px] sm:w-[160px] md:w-[180px] h-[140px] rounded-none" />
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <Skeleton className="h-5 w-[60%] mb-3" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-3 w-16 mt-2" />
      </div>
      <div className="flex w-[130px] sm:w-[150px] shrink-0 flex-col items-center justify-center border-l p-4">
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-14 mb-3" />
        <Skeleton className="h-9 w-full rounded-full" />
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
  label?: string
  className?: string
}

export function PriceDisplay({ amount, label = 'Premium', className }: PriceDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-foreground text-xs font-semibold">PHP</span>
        <span className="text-foreground text-xl font-black sm:text-2xl">
          {amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
      <span className="text-foreground text-xs font-medium">{label}</span>
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
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className={`h-2.5 w-2.5 rounded-full border ${currentSort === option.key ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
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
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full border ${provider.isActive ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`} />
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
                <li key={coverage} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
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
export function NoPlanState({ onModifySearch }: { onModifySearch?: () => void }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 className="mb-2 text-lg font-bold text-foreground">No Plans Available</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          No insurance plans are available for your selected criteria. Please try different details or contact your agent for assistance.
        </p>
        {onModifySearch && (
          <button
            onClick={onModifySearch}
            className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Modify Search
          </button>
        )}
      </div>
    </div>
  )
}
