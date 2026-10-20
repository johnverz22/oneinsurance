'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import {
  FilterOption,
  Group,
  PLAN_SORT_OPTIONS,
  titleCase,
  type PlanSortKey,
} from '@/components/travel-insurance/plan-filter-sidebar'

interface PlanFilterSheetProps {
  open: boolean
  onClose: () => void
  resultCount: number
  sortBy: PlanSortKey
  onSortChange: (key: PlanSortKey) => void
  providers: { code: string; name: string }[]
  selectedProviders: string[]
  onToggleProvider: (code: string) => void
  coverages: string[]
  selectedCoverages: string[]
  onToggleCoverage: (name: string) => void
  onClear: () => void
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function PlanFilterSheet(props: PlanFilterSheetProps) {
  const { open, onClose } = props
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const canClear = props.selectedProviders.length + props.selectedCoverages.length > 0 || props.sortBy !== 'match'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden" role="presentation">
      <div className="travel-sheet-backdrop fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-filter-sheet-title"
        tabIndex={-1}
        className="travel-sheet-panel relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl border border-[#dfe7df] bg-white outline-none dark:border-[#3d4140] dark:bg-[#262828]"
      >
        <div className="flex items-center justify-between border-b border-[#dfe7df] px-4 py-1 dark:border-[#3d4140]">
          <h2 id="plan-filter-sheet-title" className="text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
            Filters
          </h2>
          <div className="flex items-center">
            {canClear && (
              <button
                type="button"
                onClick={props.onClear}
                className="min-h-11 rounded-md px-3 text-sm font-semibold text-[#006838] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="inline-flex size-11 items-center justify-center rounded-md text-[#183d2c] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
          <Group title="Sort by">
            {PLAN_SORT_OPTIONS.map((o) => (
              <FilterOption
                key={o.value}
                label={o.label}
                active={props.sortBy === o.value}
                onClick={() => props.onSortChange(o.value)}
              />
            ))}
          </Group>
          <Group title="Providers">
            {props.providers.map((p) => (
              <FilterOption
                key={p.code}
                label={p.name}
                active={props.selectedProviders.includes(p.code)}
                onClick={() => props.onToggleProvider(p.code)}
              />
            ))}
          </Group>
          {props.coverages.length > 0 && (
            <Group title="Coverages">
              {props.coverages.map((c) => (
                <FilterOption
                  key={c}
                  square
                  label={titleCase(c)}
                  active={props.selectedCoverages.includes(c)}
                  onClick={() => props.onToggleCoverage(c)}
                />
              ))}
            </Group>
          )}
        </div>

        <div className="border-t border-[#dfe7df] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-[#3d4140]">
          <button type="button" onClick={onClose} className="travel-apply" aria-live="polite">
            Show {props.resultCount} {props.resultCount === 1 ? 'plan' : 'plans'}
          </button>
        </div>
      </div>
    </div>
  )
}
