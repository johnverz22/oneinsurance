'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Application } from '@/types/application'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Ellipsis, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '../ui/badge'
import StatusBadge from './status-badge'

export const applicationColumns: ColumnDef<Application>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Application ID
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row, column }) => {
      return <StatusBadge status={row.getValue(column.id)} />
    },
  },
  {
    accessorKey: 'submittedDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Submitted Date
          <ArrowUpDown />
        </Button>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
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
            <DropdownMenuItem>View Application</DropdownMenuItem>
            <DropdownMenuItem>Edit Application</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
