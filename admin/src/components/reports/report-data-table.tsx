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
      <div className="rounded-lg border">
        {/* Overview Header */}
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">Overview</h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="py-4 font-semibold">
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
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing {startRecord} of {totalRecords} Agent Overview
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={
                  isServerSidePagination
                    ? currentPage <= 1
                    : !table.getCanPreviousPage()
                }
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handlePageChange(page)}
                    className="h-8 w-8"
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={
                  isServerSidePagination
                    ? currentPage >= totalPages
                    : !table.getCanNextPage()
                }
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
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
