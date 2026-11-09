'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Quotation } from '@/types/quotation'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import StatusBadge from './status-badge'

export const quotationColumns: ColumnDef<Quotation>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quotation ID
          <ArrowUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: 'clientName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Client Name
          <ArrowUpDown />
        </Button>
      )
    },
  },
  {
    accessorKey: 'policyType',
    header: 'Policy Type',
  },
  {
    accessorKey: 'premium',
    header: 'Premium',
  },
  {
    accessorKey: 'coverage',
    header: 'Coverage',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row, column }) => <StatusBadge status={row.getValue(column.id)} />,
  },
  {
    accessorKey: 'createdDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created On
          <ArrowUpDown />
        </Button>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: (row) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Quotation</DropdownMenuItem>
            <DropdownMenuItem>Edit Quotation</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
