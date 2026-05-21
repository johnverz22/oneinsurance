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
import {
  ArrowUpDown,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface AgentDataTableAction<TData> {
  label: string
  icon?: React.ReactNode
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive' | 'ghost'
}

export interface AgentDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  actions?: AgentDataTableAction<TData>[]
  getRowActions?: (row: TData) => AgentDataTableAction<TData>[]
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  pageSize?: number
  enablePagination?: boolean
}

export function AgentDataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
  searchKey,
  actions,
  getRowActions,
  onRowClick,
  enableRowSelection = false,
  enableColumnVisibility = true,
  pageSize = 10,
  enablePagination = true,
}: AgentDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  })

  // Add selection column if enabled
  const tableColumns = React.useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = []

    if (enableRowSelection) {
      cols.push({
        id: '__select__',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>)
    }

    cols.push(...columns)

    // Add actions column if actions or getRowActions provided
    if (actions || getRowActions) {
      cols.push({
        id: '__actions__',
        enableHiding: false,
        cell: ({ row }) => {
          const rowData = row.original
          const rowActions = getRowActions
            ? getRowActions(rowData)
            : actions || []

          if (rowActions.length === 0) return null

          return (
            <DropdownMenu>
              <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {rowActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      action.onClick(rowData)
                    }}
                    className={
                      action.variant === 'destructive' ? 'text-red-600' : ''
                    }
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      } as ColumnDef<TData, TValue>)
    }

    return cols
  }, [columns, actions, getRowActions, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  React.useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, table])

  const total = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize_internal = table.getState().pagination.pageSize
  const firstIndex = pageIndex * pageSize_internal + 1
  const lastIndex = Math.min(firstIndex + table.getPaginationRowModel().rows.length - 1, total)

  return (
    <div className="w-full rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-gray-50 hover:bg-gray-50 border-y border-gray-200"
            >
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
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
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  'h-16 border-b',
                  index % 2 === 1 ? 'bg-gray-100 dark:bg-gray-900' : 'bg-white',
                  { 'cursor-pointer hover:bg-gray-50': onRowClick }
                )}
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
                colSpan={tableColumns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {enablePagination && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t px-5 py-3 md:flex-row">
          <div className="text-sm text-muted-foreground">
            Showing {firstIndex}–{lastIndex} of {total} results
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {'<<'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(table.getPageCount(), 7) }, (_, i) => {
              const pageCount = table.getPageCount()
              const current = table.getState().pagination.pageIndex
              let pageIdx: number
              if (pageCount <= 7) {
                pageIdx = i
              } else if (current < 4) {
                pageIdx = i < 5 ? i : i === 5 ? -1 : pageCount - 1
              } else if (current > pageCount - 5) {
                pageIdx = i === 0 ? 0 : i === 1 ? -1 : pageCount - 7 + i
              } else {
                pageIdx = i === 0 ? 0 : i === 1 ? -1 : i === 5 ? -1 : i === 6 ? pageCount - 1 : current - 2 + (i - 2)
              }
              if (pageIdx === -1) return <span key={i} className="px-1 text-gray-400">…</span>
              return (
                <Button
                  key={pageIdx}
                  variant={table.getState().pagination.pageIndex === pageIdx ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => table.setPageIndex(pageIdx)}
                  className={cn('h-8 w-8 rounded-md p-0 text-sm', {
                    'from-primary to-accent bg-gradient-to-r text-white border-transparent': table.getState().pagination.pageIndex === pageIdx
                  })}
                >
                  {pageIdx + 1}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-md p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {'>>'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create sortable column header
export function createSortableHeader<TData>(label: string, column: any) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}
