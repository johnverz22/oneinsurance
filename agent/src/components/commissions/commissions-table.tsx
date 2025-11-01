import { useState } from 'react'
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { COMMISSIONS } from '@/constants/commissions'
import { commissionsColumn } from './commissions-data-columns'
import { Commission } from '@/types/commission'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination'
import { Button } from '../ui/button'

export default function CommissionTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [statusFiler, setSatusFilter] = useState('all')
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const commissionTable = useReactTable({
    data: COMMISSIONS,
    columns: commissionsColumn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, _, filterValue) => {
      const commision = row.original as Commission
      const searchableText =
        `${commision.name} ${commision.status}`.toLowerCase()
      return searchableText.includes(filterValue.toLowerCase())
    },
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end">
        <Select
          value={statusFiler}
          onValueChange={(value) => {
            setSatusFilter(value)
            if (value === 'all') {
              commissionTable.getColumn('status')?.setFilterValue(undefined)
            } else {
              commissionTable.getColumn('status')?.setFilterValue(value)
            }
          }}
        >
          <SelectTrigger className="h-11 w-full lg:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="clawback">Clawback</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {commissionTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {flexRender(
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
            {commissionTable.getRowModel().rows?.length ? (
              commissionTable.getRowModel().rows.map((row) => (
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
                  colSpan={commissionsColumn.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination className="mt-4 justify-end text-sm">
        <PaginationContent className="gap-4">
          <p className="text-gray-400">
            Page {pagination.pageIndex + 1} of {commissionTable.getPageCount()}
          </p>
          <div className="flex gap-2">
            <PaginationItem>
              <Button
                variant={'outline'}
                onClick={() => commissionTable.firstPage()}
              >
                <ChevronsLeft />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant={'outline'}
                onClick={() => {
                  if (commissionTable.getCanPreviousPage()) {
                    commissionTable.previousPage()
                  }
                }}
              >
                <ChevronLeft />
              </Button>
            </PaginationItem>
          </div>

          <div className="flex gap-2">
            <PaginationItem>
              <Button
                variant={'outline'}
                onClick={() => {
                  if (commissionTable.getCanNextPage()) {
                    commissionTable.nextPage()
                  }
                }}
              >
                <ChevronRight />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant={'outline'}
                onClick={() => commissionTable.lastPage()}
              >
                <ChevronsRight />
              </Button>
            </PaginationItem>
          </div>
        </PaginationContent>
      </Pagination>
    </>
  )
}
