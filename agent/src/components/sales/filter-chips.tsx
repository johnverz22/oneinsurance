'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FilterChip = {
  /** Unique key for this chip */
  key: string
  /** Human-readable label shown inside the chip */
  label: string
  /** Called when the remove × is clicked */
  onRemove: () => void
}

type FilterChipsProps = {
  chips: FilterChip[]
  className?: string
}

/**
 * FilterChips — renders a row of removable active-filter pills.
 * Each chip announces its label via aria-label on the remove button.
 * Hidden (renders nothing) when the chips array is empty.
 */
export function FilterChips({ chips, className }: FilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <ul
      aria-label="Active filters"
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      {chips.map((chip) => (
        <li key={chip.key}>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--subtle)] pl-2.5 pr-1 py-0.5 text-xs font-medium text-[var(--text-sub)]">
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
            >
              <X className="size-2.5" aria-hidden="true" />
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}
