'use client'

import { cn } from '@/lib/utils'

type PaginationBarProps = {
  currentPage: number
  lastPage: number
  total?: number
  from?: number
  to?: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationBar({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
  className,
}: PaginationBarProps) {
  if (lastPage <= 1) return null

  const pages: number[] = []
  const start = Math.max(1, Math.min(currentPage - 2, lastPage - 4))
  for (let p = start; p <= Math.min(lastPage, start + 4); p++) pages.push(p)

  const btn =
    'inline-flex min-h-11 items-center justify-center rounded-md border border-[#c7d4c9] bg-white px-3 text-sm text-[#183d2c] transition-colors hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#565c58] dark:bg-transparent dark:text-[#f4f5f2] dark:hover:bg-[#303232]'

  return (
    <div className={cn('mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      {typeof total === 'number' && (
        <p className="text-xs text-[#5b6e61] dark:text-[#b2b7b4]">
          Showing {from ?? 0}–{to ?? 0} of {total}
        </p>
      )}
      <div className="flex items-center gap-1.5">
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
              'min-w-11',
              p === currentPage &&
                'border-[#006838] bg-[#006838] text-white hover:bg-[#006838]'
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
      </div>
    </div>
  )
}
