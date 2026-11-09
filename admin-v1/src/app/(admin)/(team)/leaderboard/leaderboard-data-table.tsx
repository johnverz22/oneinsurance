'use client'

import { Badge } from '@/components/ui/badge'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

export interface LeaderboardAgent {
  rank: number
  name: string
  role: string
  team: string
  totalSales: number
  commission: number
  overriders: string[]
}

export interface LeaderboardDataTableAction<TData> {
  label: string
  onClick: (row: TData) => void
  icon?: React.ReactNode
}

interface LeaderboardDataTableProps {
  data: LeaderboardAgent[]
  actions?: LeaderboardDataTableAction<LeaderboardAgent>[]
}

export function LeaderboardDataTable({
  data,
  actions = [],
}: LeaderboardDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toLocaleString()}`
  }

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'bg-[#FFD700] text-white'
      case 2:
        return 'bg-[#A8A9AD] text-white'
      case 3:
        return 'bg-[#CD7F32] text-white'
      default:
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const getOverriderInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    return parts.map((part) => part.charAt(0).toUpperCase()).join('')
  }

  const columns = useMemo<ColumnDef<LeaderboardAgent>[]>(
    () => [
      {
        accessorKey: 'rank',
        header: 'Rank',
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${getRankColor(row.original.rank)}`}
            >
              #{row.original.rank}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Agent',
        cell: ({ row }) => (
          <div>
            <h4 className="font-bold">{row.original.name}</h4>
            <p className="text-muted-foreground text-sm">{row.original.role}</p>
          </div>
        ),
      },
      {
        accessorKey: 'team',
        header: 'Team',
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="rounded-full bg-blue-300 px-4 text-base text-blue-700"
          >
            {row.original.team}
          </Badge>
        ),
      },
      {
        accessorKey: 'totalSales',
        header: 'Total Sales',
        cell: ({ row }) => (
          <div className="font-bold">
            {formatCurrency(row.original.totalSales)}
          </div>
        ),
      },
      {
        accessorKey: 'commission',
        header: 'Commission',
        cell: ({ row }) => (
          <div className="font-bold text-green-600">
            {formatCurrency(row.original.commission)}
          </div>
        ),
      },
      {
        accessorKey: 'overriders',
        header: 'Overriders',
        cell: ({ row }) => {
          const overriders = row.original.overriders
          const displayOverriders = overriders.slice(0, 3)
          const remainingCount = overriders.length - 3

          return (
            <div className="flex items-center justify-end -space-x-3">
              {displayOverriders.map((name, index) => (
                <div
                  key={index}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-green-200 font-semibold text-green-700"
                  title={name}
                >
                  {getOverriderInitials(name)}
                </div>
              ))}
              {remainingCount > 0 && (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-gray-300 text-xs font-semibold text-gray-700"
                  title={`+${remainingCount} more`}
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          )
        },
      },
      ...(actions.length > 0
        ? [
            {
              id: 'actions',
              header: 'Action',
              cell: ({ row }: { row: any }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => action.onClick(row.original)}
                      >
                        {action.icon && (
                          <span className="mr-2">{action.icon}</span>
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            } as ColumnDef<LeaderboardAgent>,
          ]
        : []),
    ],
    [actions]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="border-y-1 border-gray-400 py-5 text-center text-lg font-bold"
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
