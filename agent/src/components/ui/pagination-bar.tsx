'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PaginationBarProps = {
  /** Current page (already clamped to range by the caller) */
  page: number
  totalPages: number
  perPage: number
  onPageChange: React.Dispatch<React.SetStateAction<number>>
  /** Called with the new page size; the bar also resets to page 1 */
  onPerPageChange: (perPage: number) => void
  fromItem: number
  toItem: number
  totalItems: number
  /** id for the rows-per-page select's label */
  rowsId?: string
  pageSizeOptions?: number[]
  className?: string
}

const NAV_BUTTON =
  'inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-sub)] transition-colors hover:bg-[var(--subtle)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--primary)]'

/**
 * PaginationBar — "Showing X–Y of Z results" + rows-per-page select +
 * first/prev/next/last page controls, matching the official table footer.
 */
export function PaginationBar({
  page,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  fromItem,
  toItem,
  totalItems,
  rowsId = 'pagination-rows',
  pageSizeOptions = [10, 25, 50],
  className,
}: PaginationBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4 text-sm sm:px-6',
        className
      )}
    >
      <p className="text-[var(--text-muted)]">
        Showing {fromItem}–{toItem} of {totalItems.toLocaleString()} results
      </p>

      <div className="flex items-center gap-2">
        <label htmlFor={rowsId} className="text-[var(--text-muted)]">
          Rows
        </label>
        <select
          id={rowsId}
          value={perPage}
          onChange={(e) => {
            onPerPageChange(Number(e.target.value))
            onPageChange(1)
          }}
          className="table-page-select"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={page <= 1}
          aria-disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          className={NAV_BUTTON}
        >
          <ChevronsLeft className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={page <= 1}
          aria-disabled={page <= 1}
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          aria-label="Previous page"
          className={NAV_BUTTON}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <span className="whitespace-nowrap text-[var(--text-sub)]">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          aria-disabled={page >= totalPages}
          onClick={() => onPageChange((p) => p + 1)}
          aria-label="Next page"
          className={NAV_BUTTON}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          aria-disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          className={NAV_BUTTON}
        >
          <ChevronsRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
