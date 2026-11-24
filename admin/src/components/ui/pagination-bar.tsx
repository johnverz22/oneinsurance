'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'
import { SelectField } from '@/components/ui/select-field'

export const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 25, 50]

type PaginationBarProps = {
  currentPage: number
  lastPage: number
  total?: number
  from?: number
  to?: number
  onPageChange: (page: number) => void
  /** Current rows-per-page. Pass with `onPerPageChange` to show the rows selector. */
  perPage?: number
  onPerPageChange?: (perPage: number) => void
  perPageOptions?: number[]
  className?: string
}

/**
 * Table footer: "Showing x–y of z" summary, optional rows selector and the
 * page buttons. The rows selector and pagination operate on filtered results.
 */
export function PaginationBar({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  className,
}: PaginationBarProps) {
  const rowsId = useId()
  const hasRowsSelector = !!onPerPageChange && typeof perPage === 'number'

  if (lastPage <= 1 && !hasRowsSelector) return null

  const pages: number[] = []
  const start = Math.max(1, Math.min(currentPage - 2, lastPage - 4))
  for (let p = start; p <= Math.min(lastPage, start + 4); p++) pages.push(p)

  const options = perPageOptions.includes(perPage ?? -1)
    ? perPageOptions
    : [...perPageOptions, perPage as number].sort((a, b) => a - b)

  const btn =
    'inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-sub)] transition-colors hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#565c58] dark:bg-transparent dark:hover:bg-[#303232]'

  return (
    <div
      className={cn(
        'mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row sm:flex-wrap',
        className
      )}
    >
      {typeof total === 'number' && (
        <p className="text-sm tabular-nums text-[var(--text-sub)]" aria-live="polite">
          {total > 0
            ? `Showing ${from ?? 0}–${to ?? 0} of ${total} results`
            : 'Showing 0 of 0 results'}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasRowsSelector && (
          <>
            <label htmlFor={rowsId} className="text-sm text-[var(--text-main)]">
              Rows
            </label>
            <SelectField
              id={rowsId}
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="mt-0 w-auto"
            >
              {options.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
          </>
        )}
        {lastPage > 1 && (
          <nav aria-label="Pagination" className="flex items-center gap-1.5">
            <button
              type="button"
              className={btn}
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </button>
            {pages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
                className={cn(
                  btn,
                  'min-w-11 tabular-nums',
                  p === currentPage &&
                    'border-[#006838] bg-[#006838] font-semibold text-white hover:bg-[#006838] dark:border-[#006838] dark:bg-[#006838] dark:hover:bg-[#006838]'
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={btn}
              disabled={currentPage >= lastPage}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
