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
      <div className="border-muted-foreground/30 flex flex-col justify-between gap-4 border-b pt-2.5 pb-4 lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <h3 className="text-base font-bold md:text-lg lg:text-xl">
            {header}
          </h3>
          <p className="text-muted-foreground font-light">{description}</p>
        </div>

        <div className="flex items-center gap-4">
          {searchKey && (
            <div className="relative flex-1 lg:w-md">
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
                className={cn('pl-4', { 'pl-9': !isServerSide })}
              />
            </div>
          )}

          {searchKey && isServerSide && (
            <div className="flex gap-1.5">
              <Button
                onClick={handleSearchApply}
                disabled={isLoading}
                size="lg"
                className="h-11 w-11"
              >
                <Search />
              </Button>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Button
                  onClick={handleSearchClear}
                  disabled={isLoading || pendingSearch === ''}
                  variant="outline"
                  size="lg"
                  className="h-11 w-11"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
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
                  .map((column) => {
                    return (
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
                    )
                  })}
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

          {customAction}
        </div>
      </div>

      <div className="bg-background rounded-ld">
        {isLoading ? (
          <div className="grid gap-2 md:grid-cols-2">
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
                  'grid gap-3',
                  `lg:grid-cols-${props.numColumns}`,
                  props.containerClassName
                )}
              >
                {table.getRowModel().rows.map((row) => {
                  return <div key={row.id}>{props.contentRenderer(row)}</div>
                })}
              </div>
            ) : (
              <div className="flex h-40 w-full items-center justify-center">
                No results found.
              </div>
            )}
          </>
        ) : (
          <Table>
            <TableHeader className="bg-muted-foreground/5 border-t">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="py-4 text-base font-bold"
                      >
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
            <TableBody className="border-b">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'bg-background h-16',
                      { 'cursor-pointer': onRowClick },
                      {
                        'bg-gray-100 dark:bg-gray-900':
                          alternateColors && index % 2 === 1,
                      }
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
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {enableRowSelection && (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row">
          {total > 0 && (
            <div className="text-muted-foreground text-sm">
              Showing {firstIndex}-{lastIndex} of {total}
            </div>
          )}

          {total > 0 && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px] !rounded-md">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                    className="!rounded-md"
                  />
                </SelectTrigger>
                <SelectContent side="top" className="rounded">
                  {paginationOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 !rounded-md p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: table.getPageCount() },
                    (_, i) => i
                  ).map((pageIdx) => (
                    <Button
                      key={pageIdx}
                      variant={
                        table.getState().pagination.pageIndex === pageIdx
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => table.setPageIndex(pageIdx)}
                      className="h-8 w-8 !rounded-md p-0"
                    >
                      {pageIdx + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 !rounded-md p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
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
