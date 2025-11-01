'use client'

import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Download, Trash2 } from 'lucide-react'
import type { ClientStatus } from '@/types/client'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  onBulkDelete?: (selectedRows: TData[]) => void
  onExport?: (data: TData[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onBulkDelete,
  onExport,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<ClientStatus | 'all'>(
    'all'
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _, filterValue) => {
      const client = row.original as any
      const searchableText =
        `${client.firstName} ${client.lastName} ${client.email} ${client.phone} ${client.occupation}`.toLowerCase()
      return searchableText.includes(filterValue.toLowerCase())
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  React.useEffect(() => {
    table.getColumn('status')?.setFilterValue(statusFilter)
  }, [statusFilter, table])

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex w-full flex-col items-center gap-2 lg:flex-row">
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as ClientStatus | 'all')
            }
          >
            <SelectTrigger className="h-11 w-full lg:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {onExport && (
            <Button
              variant="outline"
              className="h-11 w-full lg:w-max"
              onClick={() => onExport(data)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>

        {selectedRows.length > 0 && (
          <div className="flex w-full items-center justify-end space-x-2">
            <span className="text-muted-foreground text-sm">
              {selectedRows.length} of {table.getFilteredRowModel().rows.length}{' '}
              row(s) selected
            </span>
            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete(selectedRows)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col justify-between gap-2 py-4 lg:flex-row lg:items-center">
        <div className="flex items-center justify-between space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-x-6 lg:gap-x-8">
          <div className="flex max-w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 bg-transparent p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {'<<'}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 bg-transparent p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {'<'}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 bg-transparent p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {'>'}
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 bg-transparent p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {'>>'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-muted-foreground text-xs">
        Showing {table.getRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} results
        {table.getFilteredRowModel().rows.length !== data.length &&
          ` (filtered from ${data.length} total)`}
      </div>
    </div>
  )
}
