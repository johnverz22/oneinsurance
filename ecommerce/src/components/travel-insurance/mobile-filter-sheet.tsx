'use client'

import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COMPANIES } from '@/constants/companies'

// SortOption is a string alias so the sheet works with any sort-key set
// (the remote's SortKey includes 'match'; a narrower union would break here).
export type SortOption = string

interface SortDef {
  value: string
  label: string
}

const DEFAULT_SORT_OPTIONS: SortDef[] = [
  { value: 'match', label: 'Best match' },
  { value: 'lowest', label: 'Lowest price' },
  { value: 'highest', label: 'Highest coverage' },
  { value: 'addons', label: 'With add-ons' },
  { value: 'discounts', label: 'With discounts' },
]

interface MobileFilterSheetProps {
  open: boolean
  onClose: () => void

  sortBy: string
  onSortChange: (v: string) => void
  sortOptions?: SortDef[]

  availableProviders: string[]
  selectedProviders: string[]
  onProviderToggle: (code: string) => void
  hideProviderFilter?: boolean

  availableCoverages: string[]
  selectedCoverages: string[]
  onCoverageToggle: (coverage: string) => void

  planCount: number
  onClearAll: () => void
}

/**
 * Mobile-only full-height bottom sheet for filters.
 * Hidden on sm+ (the desktop sidebar handles filters there).
 */
export function MobileFilterSheet({
  open,
  onClose,
  sortBy,
  onSortChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  availableProviders,
  selectedProviders,
  onProviderToggle,
  hideProviderFilter,
  availableCoverages,
  selectedCoverages,
  onCoverageToggle,
  planCount,
  onClearAll,
}: MobileFilterSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Trap body scroll while open
  useEffect(() => {
    if (open) {
      document.body.classList.add('no-doc-scroll')
    } else {
      document.body.classList.remove('no-doc-scroll')
    }
    return () => document.body.classList.remove('no-doc-scroll')
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Focus the sheet when it opens
  useEffect(() => {
    if (open) sheetRef.current?.focus()
  }, [open])

  const totalActiveFilters = selectedProviders.length + selectedCoverages.length

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        className={cn(
          'sm:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        tabIndex={-1}
        className={cn(
          'sm:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col',
          'bg-card rounded-t-2xl shadow-2xl',
          'max-h-[92dvh]',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
          'outline-none',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 pb-3">
          <h2 className="text-base font-semibold text-foreground">
            Filters
            {totalActiveFilters > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {totalActiveFilters}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Sort */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Sort by
            </h3>
            <div className="space-y-1">
              {sortOptions.map((opt) => {
                const active = sortBy === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSortChange(opt.value)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        active ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card',
                      )}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Providers */}
          {!hideProviderFilter && availableProviders.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Insurance Provider
              </h3>
              <div className="space-y-1">
                {availableProviders.map((code) => {
                  const company = COMPANIES.find((c) => c.carrierCode === code)
                  const active = selectedProviders.includes(code)
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onProviderToggle(code)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          active ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card',
                        )}
                      >
                        {active && <Check className="size-3 text-primary-foreground" />}
                      </span>
                      {company?.companyName ?? code}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Coverages */}
          {availableCoverages.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Coverage
              </h3>
              <div className="space-y-1">
                {availableCoverages.map((coverage) => {
                  const active = selectedCoverages.includes(coverage)
                  const label = coverage
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ')
                  return (
                    <button
                      key={coverage}
                      type="button"
                      onClick={() => onCoverageToggle(coverage)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          active ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card',
                        )}
                      >
                        {active && <Check className="size-3 text-primary-foreground" />}
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border px-4 py-3 flex gap-3">
          <button
            type="button"
            onClick={onClearAll}
            className="flex-1 rounded-full border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] rounded-full from-primary to-lilac bg-gradient-to-r py-3 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Show {planCount} {planCount === 1 ? 'plan' : 'plans'}
          </button>
        </div>
      </div>
    </>
  )
}
