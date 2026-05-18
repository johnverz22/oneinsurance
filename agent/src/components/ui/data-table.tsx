'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  X,
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
import { cn } from '@/lib/utils'
import { formatCapitalizeFirstLetter } from '@/utils/formatter'
import { Skeleton } from './skeleton'
import { Card, CardContent } from './card'

export interface DataTableTableMode {
  renderMode: 'table'
}

export interface DataTableListMode<TData> {
  renderMode: 'list'
  contentRenderer: (row: Row<TData>) => React.ReactNode
  containerClassName?: string
  numColumns?: number
}

export interface DataTableHeaderProps {
  header?: string
  description?: string
  searchPlaceholder?: string
}

export interface DataTableAction<TData> {
  label: string
  icon?: React.ReactNode
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive' | 'ghost'
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export interface ServerSidePaginationConfig {
  enabled: true
  paginatedResponse: PaginatedResponse<any>
  onPaginationChange: (page: number, pageSize: number) => void
  onSearchChange?: (search: string) => void
  onSortingChange?: (sorting: SortingState) => void
}

export interface ClientSidePaginationConfig {
  enabled?: false
}

export type PaginationConfig =
  | ServerSidePaginationConfig
  | ClientSidePaginationConfig

export interface DataTableBaseProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  customAction?: React.ReactNode
  searchKey?: keyof TData | Array<keyof TData>
  actions?: DataTableAction<TData>[]
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableExport?: boolean
  pageSize?: number
  alternateColors?: boolean
  isLoading?: boolean
  pagination?: PaginationConfig
}

export type DataTableProps<
  TData extends Record<string, any>,
  TValue,
> = DataTableHeaderProps &
  DataTableBaseProps<TData, TValue> &
  (DataTableTableMode | DataTableListMode<TData>)

export function DataTable<TData extends Record<string, any>, TValue>({
  header = '',
  description = '',
  searchPlaceholder,
  columns,
  data,
  customAction,
  searchKey,
  actions,
  onRowClick,
  enableRowSelection = false,
  enableColumnVisibility = false,
  enableExport = false,
  pageSize = 10,
  alternateColors = false,
  isLoading = false,
  pagination: paginationConfig,
  ...props
}: DataTableProps<TData, TValue>) {
  const numColumns = props.renderMode === 'list' ? (props.numColumns ?? 3) : 1
  const isServerSide = paginationConfig?.enabled === true

  // Extract server-side pagination data
  const serverPageCount = isServerSide
    ? paginationConfig.paginatedResponse.last_page
    : 0
  const serverTotal = isServerSide
    ? paginationConfig.paginatedResponse.total
    : 0
  const serverCurrentPage = isServerSide
    ? paginationConfig.paginatedResponse.current_page
    : 1
  const serverPerPage = isServerSide
    ? paginationConfig.paginatedResponse.per_page
    : pageSize

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: isServerSide ? serverCurrentPage - 1 : 0,
    pageSize: isServerSide
      ? serverPerPage
      : props.renderMode === 'list'
        ? (props.numColumns ?? 3) * 3
        : pageSize,
  })

  const [globalFilter, setGlobalFilter] = React.useState<string>('')
  const [pendingSearch, setPendingSearch] = React.useState<string>('')

  // Sync pending search with global filter on mount for client-side
  React.useEffect(() => {
    if (!isServerSide) {
      setPendingSearch(globalFilter)
    }
  }, [globalFilter, isServerSide])

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    if (isServerSide) {
      setPendingSearch(value)
    } else {
      setGlobalFilter(value)
    }
  }

  // Handle search apply (server-side only)
  const handleSearchApply = () => {
    if (isServerSide && paginationConfig.onSearchChange) {
      setGlobalFilter(pendingSearch)
      paginationConfig.onSearchChange(pendingSearch)
      // Reset to first page on search
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }

  // Handle search clear
  const handleSearchClear = () => {
    setPendingSearch('')
    setGlobalFilter('')
    if (isServerSide && paginationConfig.onSearchChange) {
      paginationConfig.onSearchChange('')
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }

  // Handle server-side pagination changes
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater

    setPagination(newPagination)

    if (isServerSide) {
      paginationConfig.onPaginationChange(
        newPagination.pageIndex + 1,
        newPagination.pageSize
      )
    }
  }

  // Handle server-side sorting changes
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const newSorting =
      typeof updater === 'function' ? updater(sorting) : updater

    setSorting(newSorting)

    if (isServerSide && paginationConfig.onSortingChange) {
      paginationConfig.onSortingChange(newSorting)
    }
  }

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

    // Add actions column if actions provided
    if (actions && actions.length > 0) {
      cols.push({
        id: '__actions__',
        enableHiding: false,
        cell: ({ row }) => {
          const rowData = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(rowData)}
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
  }, [columns, actions, enableRowSelection])

  const multiKeyGlobalFilter = <TData,>(
    row: Row<TData>,
    _columnId: string,
    filterValue: string,
    searchKey: keyof TData | Array<keyof TData>
  ) => {
    if (!filterValue) return true

    const search = filterValue.toLowerCase()

    // Normalize keys to array
    const keys = Array.isArray(searchKey) ? searchKey : [searchKey]

    return keys.some((key) => {
      const raw = row.original[key]
      if (raw == null) return false

      return String(raw).toLowerCase().includes(search)
    })
  }

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // Server-side configuration
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    manualFiltering: isServerSide,
    pageCount: isServerSide ? serverPageCount : undefined,
    // Client-side configuration
    getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: isServerSide ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    globalFilterFn: isServerSide
      ? undefined
      : (row, colId, filterValue) => {
          return multiKeyGlobalFilter(row, colId, filterValue, searchKey ?? [])
        },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize_internal = table.getState().pagination.pageSize

  // Calculate display indices
  const firstIndex = isServerSide
    ? paginationConfig.paginatedResponse.from || 0
    : pageIndex * pageSize_internal + 1
  const lastIndex = isServerSide
    ? paginationConfig.paginatedResponse.to || 0
    : firstIndex + table.getPaginationRowModel().rows.length - 1
  const total = isServerSide
    ? serverTotal
    : table.getFilteredRowModel().rows.length

  const paginationOptions = React.useMemo(() => {
    if (props.renderMode === 'table') return [5, 10, 30, 50]

    return [3, 5, 7, 9].map((el) => el * numColumns)
  }, [props.renderMode, numColumns])

  const filterPlaceholder = React.useMemo(() => {
    if (searchPlaceholder) {
      return `Search by ${searchPlaceholder} ...`
    }

    if (!searchKey) {
      return 'Search...'
    }

    const keys = Array.isArray(searchKey) ? searchKey : [searchKey]

    const formattedKeys = keys.map((key) =>
      formatCapitalizeFirstLetter(String(key))
    )

    let keyString = ''

    if (formattedKeys.length === 1) {
      keyString = formattedKeys[0]
    } else if (formattedKeys.length === 2) {
      keyString = `${formattedKeys[0]} or ${formattedKeys[1]}`
    } else {
      const last = formattedKeys.pop()
      keyString = `${formattedKeys.join(', ')}, and ${last}`
    }

    return `Search by ${keyString} ...`
  }, [searchKey, searchPlaceholder])

  return (
    <div className="w-full space-y-6 py-2.5">
      {/* ── Header bar: title left, search + actions right ── */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 px-5 py-4 lg:flex-row lg:items-center">
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold text-gray-900">
              {header}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex items-center gap-3">
            {searchKey && (
              <div className="relative flex-1 lg:w-80">
                {!isServerSide && (
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                )}
                <Input
                  placeholder={filterPlaceholder}
                  value={isServerSide ? pendingSearch : globalFilter}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isServerSide) {
                      handleSearchApply()
                    }
                  }}
                  className={cn('rounded-full h-10', { 'pl-9': !isServerSide })}
                />
              </div>
            )}

            {searchKey && isServerSide && (
              <div className="flex gap-1.5">
                <Button
                  onClick={handleSearchApply}
                  disabled={isLoading}
                  size="sm"
                  className="h-10 w-10 rounded-full from-primary to-lilac bg-gradient-to-r text-white"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSearchClear}
                  disabled={isLoading || pendingSearch === ''}
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {enableColumnVisibility && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {enableExport && (
              <Button
                onClick={() => exportToCSV(data)}
                className="gap-2 rounded-full"
              >
                <ArrowUpRight />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Custom action (filters etc.) */}
        {customAction && (
          <div className="border-t px-5 py-4">
            {customAction}
          </div>
        )}

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-b-xl">
          {isLoading ? (
            <div className="grid gap-2 p-4 md:grid-cols-2">
              {[1, 2].map((id) => (
                <Card key={id}>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Skeleton className="bg-primary h-6 w-[50%] rounded-full" />
                      <Skeleton className="bg-primary h-6 w-[10%] rounded-full" />
                    </div>
                    <Skeleton className="bg-primary mt-4 h-4 w-[30%] rounded-full" />
                    <Skeleton className="bg-primary mt-4 h-6 w-[40%] rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : props.renderMode === 'list' ? (
            <>
              {total > 0 ? (
                <div
                  className={cn(
                    'grid gap-3 p-4',
                    `lg:grid-cols-${props.numColumns}`,
                    props.containerClassName
                  )}
                >
                  {table.getRowModel().rows.map((row) => (
                    <div key={row.id}>{props.contentRenderer(row)}</div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center text-muted-foreground">
                  No results found.
                </div>
              )}
            </>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50 border-y border-gray-200">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="py-3 text-xs font-bold uppercase tracking-wide text-gray-600"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
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
                        'border-b border-gray-100 transition-colors',
                        { 'cursor-pointer hover:bg-primary/5': onRowClick },
                        {
                          'bg-gray-50/60': alternateColors && index % 2 === 1,
                          'bg-white': !alternateColors || index % 2 === 0,
                        }
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3.5">
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
          )}
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t px-5 py-3 md:flex-row">
            <div className="text-sm text-muted-foreground">
              Showing {firstIndex}–{lastIndex} of {total} results
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-600">Rows</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px] rounded-md text-sm">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {paginationOptions.map((ps) => (
                      <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        'from-primary to-lilac bg-gradient-to-r text-white border-transparent': table.getState().pagination.pageIndex === pageIdx
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
          </div>
        )}
      </div>
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

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename = 'data.csv'
) {
  if (!data?.length) return

  const headers = Object.keys(data[0])
  const escapeCSV = (value: any) => {
    if (value == null) return ''
    const stringValue =
      value instanceof Date ? value.toISOString() : String(value)
    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue
  }

  const csvRows = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => escapeCSV(row[h])).join(',')),
  ]

  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n')
  const encodedUri = encodeURI(csvContent)

  const link = document.createElement('a')
  link.href = encodedUri
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
