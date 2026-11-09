'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface ReportDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  enablePagination?: boolean
  // Server-side pagination props
  currentPage?: number
  totalPages?: number
  totalRecords?: number
  onPageChange?: (page: number) => void
}

export function ReportDataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
  pageSize = 100000,
  enablePagination = true,
  currentPage: serverCurrentPage,
  totalPages: serverTotalPages,
  totalRecords: serverTotalRecords,
  onPageChange,
}: ReportDataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  })

  // Use server-side pagination if provided, otherwise use client-side
  const isServerSidePagination = !!onPageChange

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSidePagination
      ? undefined
      : getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    manualPagination: isServerSidePagination,
    pageCount: isServerSidePagination ? serverTotalPages : undefined,
    state: {
      columnFilters,
      columnVisibility,
      pagination: isServerSidePagination
        ? { pageIndex: (serverCurrentPage || 1) - 1, pageSize }
        : pagination,
    },
  })

  React.useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, table])

  const currentPage = isServerSidePagination
    ? serverCurrentPage || 1
    : table.getState().pagination.pageIndex + 1
  const totalPages = isServerSidePagination
    ? serverTotalPages || 1
    : table.getPageCount()
  const totalRecords = isServerSidePagination
    ? serverTotalRecords || 0
    : data.length
  const startRecord = isServerSidePagination
    ? (serverCurrentPage || 1 - 1) * pageSize + 1
    : table.getState().pagination.pageIndex * pageSize + 1
  const endRecord = isServerSidePagination
    ? Math.min((serverCurrentPage || 1) * pageSize, serverTotalRecords || 0)
    : Math.min(
        (table.getState().pagination.pageIndex + 1) * pageSize,
        totalRecords
      )

  const handlePageChange = (page: number) => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(page)
    } else {
      table.setPageIndex(page - 1)
    }
  }

  const handlePreviousPage = () => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(currentPage - 1)
    } else {
      table.previousPage()
    }
  }

  const handleNextPage = () => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(currentPage + 1)
    } else {
      table.nextPage()
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-md border overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50 border-y">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-12 text-center text-gray-500"
                  >
                    No data available. Please generate a report to view results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {enablePagination && data.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t px-5 py-3 md:flex-row">
            <div className="text-sm text-muted-foreground">
              Showing {startRecord}–{endRecord} of {totalRecords} results
            </div>
            <div className="flex items-center gap-1">
              {/* << first */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
              >
                {'<<'}
              </Button>
              {/* < prev */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={handlePreviousPage}
                disabled={
                  isServerSidePagination
                    ? currentPage <= 1
                    : !table.getCanPreviousPage()
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers with ellipsis */}
              {(() => {
                const pages: (number | -1)[] = []
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i)
                } else if (currentPage < 5) {
                  pages.push(1, 2, 3, 4, 5, -1, totalPages)
                } else if (currentPage > totalPages - 4) {
                  pages.push(1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
                } else {
                  pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages)
                }
                return pages.map((p, i) =>
                  p === -1 ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={currentPage === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(p)}
                      className={`h-8 w-8 rounded-full p-0 text-sm ${
                        currentPage === p
                          ? 'from-primary to-accent bg-gradient-to-r text-white border-transparent'
                          : ''
                      }`}
                    >
                      {p}
                    </Button>
                  )
                )
              })()}

              {/* > next */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={handleNextPage}
                disabled={
                  isServerSidePagination
                    ? currentPage >= totalPages
                    : !table.getCanNextPage()
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {/* >> last */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
              >
                {'>>'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to create sortable column header
export function createSortableHeader<TData>(
  label: string,
  column: any,
  className?: string
) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'hover:bg-transparent dark:hover:bg-transparent',
        className
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}
