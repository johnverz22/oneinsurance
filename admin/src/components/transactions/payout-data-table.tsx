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
import { Transaction } from '@/types/transactions'

interface PayoutDataTableProps {
  data: Transaction[]
  onViewDetails?: (transaction: Transaction) => void
}

export function PayoutDataTable({ data, onViewDetails }: PayoutDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<Transaction>[] = [
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
      accessorKey: 'proposal_number',
      header: 'Payment ID',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.proposal_number}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : '-'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'agent_code_used',
      header: 'Agent',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">Agent Name</div>
          <div className="text-xs text-muted-foreground">
            {row.original.agent_code_used}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.amount
        const formattedAmount =
          amount !== null
            ? typeof amount === 'string'
              ? parseFloat(amount).toLocaleString('en-PH', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : amount.toLocaleString('en-PH', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
            : '-'

        return (
          <div>
            <div className="font-medium">₱ {formattedAmount}</div>
            <div className="text-xs text-muted-foreground">Net Amount</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment Method',
      cell: ({ row }) => {
        const merchantId = row.original.merchant_transaction_id
        const lastFour = merchantId ? merchantId.slice(-4) : '****'
        
        return (
          <div>
            <div className="font-medium">Bank Transfer</div>
            <div className="text-xs text-muted-foreground">****{lastFour}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusConfig = {
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
          cancelled: {
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
      id: 'payment_method_duplicate',
      header: 'Payment Method',
      cell: ({ row }) => {
        const merchantId = row.original.merchant_transaction_id
        const lastFour = merchantId ? merchantId.slice(-4) : '****'
        
        return (
          <div>
            <div className="font-medium">Bank Transfer</div>
            <div className="text-xs text-muted-foreground">****{lastFour}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'transaction_date',
      header: 'Due Date',
      cell: ({ row }) => {
        const transactionDate = row.original.transaction_date
        const isPaid = row.original.status === 'completed'

        return (
          <div>
            <div className="font-medium">
              {transactionDate
                ? new Date(transactionDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                  })
                : '-'}
            </div>
            {isPaid && transactionDate && (
              <div className="text-xs text-green-600">
                Paid:{' '}
                {new Date(transactionDate).toLocaleDateString('en-US', {
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
          {table.getRowModel().rows?.length ? (
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {table.getRowModel().rows.length} of {data.length} payments
          </div>
        </div>
      </div>
    </div>
  )
}
