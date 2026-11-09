import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton, TableRowsSkeleton } from '@/components/ui/skeleton'
import { tableCls, tableWrapCls, thCls, theadCls } from '@/lib/ui-classes'

/**
 * Column role in the mobile list view (below `lg`):
 * - 'primary' — rendered unlabeled at the top of the card (row identity).
 * - 'badge'   — rendered top-right (e.g. status pills).
 * - 'action'  — rendered in a footer row at the bottom of the card.
 * - 'hidden'  — omitted from the card.
 * - default   — rendered as a `label: value` field row.
 */
export type DataTableColumn<T> = {
  /** Column heading — reused as the field label in the mobile list view. */
  header: ReactNode
  /** Override for the mobile field label when `header` is not plain text. */
  mobileLabel?: ReactNode
  cell: (row: T) => ReactNode
  /** Extra classes on the desktop <td>. */
  className?: string
  /** Extra classes on the desktop <th>. */
  headerClassName?: string
  /** Render this column's cell as <th scope="row"> on desktop. */
  rowHeader?: boolean
  mobile?: 'primary' | 'badge' | 'action' | 'hidden'
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => React.Key
  isLoading?: boolean
  isError?: boolean
  errorMessage?: ReactNode
  emptyMessage?: ReactNode
  onRowClick?: (row: T) => void
  /** Table min-width utility for desktop overflow, e.g. 'min-w-[960px]'. */
  minWidth?: string
  className?: string
}

const clickableCls =
  'cursor-pointer transition-colors hover:bg-[#f1f2f0] dark:hover:bg-[#303232]'
const fieldLabelCls =
  'shrink-0 text-xs font-medium text-[#5b6e61] dark:text-[#b2b7b4]'

function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <li key={r} aria-hidden="true" className="px-4 py-4">
          <Skeleton className="h-4 w-2/5" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
      <li className="sr-only">Loading…</li>
    </>
  )
}

/**
 * Responsive data table: a real <table> on lg+, a card list view below.
 * Both views share the same column definitions so rows stay in sync.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  isLoading,
  isError,
  errorMessage = 'Failed to load data. Please try again.',
  emptyMessage = 'Nothing to show.',
  onRowClick,
  minWidth,
  className,
}: DataTableProps<T>) {
  const primaryCols = columns.filter((c) => c.mobile === 'primary')
  const badgeCols = columns.filter((c) => c.mobile === 'badge')
  const actionCols = columns.filter((c) => c.mobile === 'action')
  const fieldCols = columns.filter((c) => !c.mobile)

  const state = isLoading ? 'loading' : isError ? 'error' : rows.length === 0 ? 'empty' : 'ready'

  const handleKeyDown = (row: T) => (e: KeyboardEvent) => {
    if (!onRowClick || e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRowClick(row)
    }
  }

  return (
    <div className={className}>
      {/* Desktop table */}
      <div className={cn('hidden lg:block', tableWrapCls)}>
        <table className={cn(tableCls, minWidth)}>
          <thead className={theadCls}>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn(thCls, col.headerClassName)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfe7df] dark:divide-[#3d4140]">
            {state === 'loading' ? (
              <TableRowsSkeleton cols={columns.length} />
            ) : state === 'error' ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#b91c1c] dark:text-[#eba3a3]"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : state === 'empty' ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#5b6e61] dark:text-[#b2b7b4]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? clickableCls : undefined}
                >
                  {columns.map((col, i) =>
                    col.rowHeader ? (
                      <th
                        key={i}
                        scope="row"
                        className={cn('px-4 py-4', col.className)}
                      >
                        {col.cell(row)}
                      </th>
                    ) : (
                      <td key={i} className={cn('px-4 py-4', col.className)}>
                        {col.cell(row)}
                      </td>
                    )
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list view */}
      <ul className="divide-y divide-[#dfe7df] rounded-lg border border-[#dfe7df] lg:hidden dark:divide-[#3d4140] dark:border-[#3d4140]">
        {state === 'loading' ? (
          <ListRowsSkeleton />
        ) : state === 'error' ? (
          <li className="px-4 py-12 text-center text-[#b91c1c] dark:text-[#eba3a3]">
            {errorMessage}
          </li>
        ) : state === 'empty' ? (
          <li className="px-4 py-12 text-center text-[#5b6e61] dark:text-[#b2b7b4]">
            {emptyMessage}
          </li>
        ) : (
          rows.map((row) => {
            const rawActions = actionCols.map((col) => col.cell(row))
            const hasActions = rawActions.some(Boolean)
            const actionCells = rawActions.map((content, i) => (
              <div key={i}>{content}</div>
            ))
            return (
            <li
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? handleKeyDown(row) : undefined}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn('px-4 py-4', onRowClick && clickableCls)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {primaryCols.map((col, i) => (
                    <div key={i}>{col.cell(row)}</div>
                  ))}
                </div>
                {badgeCols.length > 0 && (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {badgeCols.map((col, i) => (
                      <div key={i}>{col.cell(row)}</div>
                    ))}
                  </div>
                )}
              </div>
              {fieldCols.length > 0 && (
                <dl className="mt-3 space-y-1.5 text-sm">
                  {fieldCols.map((col, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-4"
                    >
                      <dt className={fieldLabelCls}>
                        {col.mobileLabel ?? col.header}
                      </dt>
                      <dd className="min-w-0 text-right break-words text-[var(--text-main)]">
                        {col.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {hasActions && (
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-[#dfe7df] pt-2 dark:border-[#3d4140]">
                  {actionCells}
                </div>
              )}
            </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
