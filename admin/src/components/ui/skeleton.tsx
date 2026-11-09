import { cn } from '@/lib/utils'

/** Single skeleton block using the global .skeleton pulse utility. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />
}

const skeletonCellWidths = ['w-3/5', 'w-4/5', 'w-1/2', 'w-2/3', 'w-3/4']

type TableRowsSkeletonProps = {
  /** Number of columns in the table */
  cols: number
  /** Number of placeholder rows to render */
  rows?: number
}

/** Skeleton <tr> placeholders for a table <tbody> while data is loading. */
export function TableRowsSkeleton({ cols, rows = 5 }: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden="true">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-4">
              <Skeleton
                className={cn(
                  'h-4',
                  skeletonCellWidths[(r + c) % skeletonCellWidths.length]
                )}
              />
            </td>
          ))}
        </tr>
      ))}
      <tr>
        <td colSpan={cols} className="sr-only">
          Loading…
        </td>
      </tr>
    </>
  )
}

type CardSkeletonProps = {
  className?: string
}

/** Skeleton matching the standard bordered portal card/panel. */
export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6',
        className
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

/** Full-page skeleton for route-level loading.tsx — mirrors header + content. */
export function PageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading page"
      className="mx-auto w-full max-w-7xl pt-4 lg:pt-8"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}
