import { ColumnDef } from '@tanstack/react-table'
import { Commission } from '@/types/commission'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
export const commissionsColumn: ColumnDef<Commission>[] = [
  //   {
  //     id: 'select',
  //     header: ({ table }) => (
  //       <Checkbox
  //         checked={
  //           table.getIsAllPageRowsSelected() ||
  //           (table.getIsSomePageRowsSelected() && 'indeterminate')
  //         }
  //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //         aria-label="Select all"
  //       />
  //     ),
  //     cell: ({ row }) => (
  //       <Checkbox
  //         checked={row.getIsSelected()}
  //         onCheckedChange={(value) => row.toggleSelected(!!value)}
  //         aria-label="Select row"
  //       />
  //     ),
  //     enableSorting: false,
  //     enableHiding: false,
  //   },
  {
    accessorKey: 'client',
    header: ({ column }) => (
      <Button
        variant={'ghost'}
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Client Name
        <ArrowUpDown />
      </Button>
    ),
  },
  {
    accessorKey: 'policyId',
    header: 'Policy ID',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'commission',
    header: () => <div className="text-right">Commision (PHP)</div>,
    cell: ({ row, column }) => (
      <div className="text-right">{row.getValue(column.id)}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row, column }) => (
      <div className="text-center">{row.getValue(column.id)}</div>
    ),
  },
  {
    accessorKey: 'paidDate',
    header: 'Paid Date',
    cell: ({ row, column }) => row.getValue(column.id) || 'N/A',
  },
]
