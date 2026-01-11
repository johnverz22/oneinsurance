'use client'

import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Payout } from '@/types/payout'
import { Skeleton } from '@/components/ui/skeleton'

interface PayoutDataTableProps {
  data: Payout[]
  isLoading?: boolean
  onViewDetails?: (payout: Payout) => void
}

export function PayoutDataTable({
  data,
  isLoading,
  onViewDetails,
}: PayoutDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<Payout>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    },
    {
      accessorKey: 'payout_reference',
      header: 'Payment ID',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.payout_reference}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.date_generated
              ? new Date(row.original.date_generated).toLocaleDateString(
                  'en-US',
                  {
                    month: 'long',
                    year: 'numeric',
                  }
                )
              : '-'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'agent_name',
      header: 'Agent',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.agent_name}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.agent_id}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'payout_amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.payout_amount
        const formattedAmount = amount.toLocaleString('en-PH', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })

        return (
          <div>
            <div className="font-medium">₱ {formattedAmount}</div>
            <div className="text-muted-foreground text-xs">Net Amount</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'account_type',
      header: 'Payment Method',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.account_type}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.account_number}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusConfig: Record<
          string,
          { label: string; className: string; icon: string }
        > = {
          completed: {
            label: 'Paid',
            className: 'bg-green-100 text-green-800',
            icon: '✓',
          },
          pending: {
            label: 'Pending',
            className: 'bg-orange-100 text-orange-800',
            icon: '⏱',
          },
          failed: {
            label: 'Failed',
            className: 'bg-red-100 text-red-800',
            icon: '✕',
          },
          processing: {
            label: 'Processing',
            className: 'bg-blue-100 text-blue-800',
            icon: '⟳',
          },
        }

        const config = statusConfig[status] || statusConfig.pending

        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${config.className}`}
          >
            <span>{config.icon}</span>
            {config.label}
          </span>
        )
      },
    },
    {
      accessorKey: 'account_name',
      header: 'Account Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.account_name}</div>
          <div className="text-muted-foreground text-xs">
            {row.original.account_number}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'date_to',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.original.date_to
        const isPaid = row.original.status === 'completed'
        const paidDate = row.original.date_generated

        return (
          <div>
            <div className="font-medium">
              {dueDate
                ? new Date(dueDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                  })
                : '-'}
            </div>
            {isPaid && paidDate && (
              <div className="text-xs text-green-600">
                Paid:{' '}
                {new Date(paidDate).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails?.(row.original)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
            <DropdownMenuItem>Resend Notification</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  })

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Payment Transaction</h2>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="border-t p-4">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <div>
            Showing {table.getRowModel().rows.length} of {data.length} payments
          </div>
        </div>
      </div>
    </div>
  )
}
