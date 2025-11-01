'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { Quotation } from '@/types/quotation'
import { cn } from '@/lib/utils'

const QUOTATIONS: Quotation[] = [
  {
    id: 1,
    name: 'John Doe',
    type: 'Life',
    premium: 12500,
    coverage: 500000,
    status: 'Approved',
    createdOn: new Date('2025-07-12'),
  },
  {
    id: 2,
    name: 'Jane Smith',
    type: 'Health',
    premium: 8900,
    coverage: 300000,
    status: 'In Review',
    createdOn: new Date('2025-08-05'),
  },
  {
    id: 3,
    name: 'Carlos Reyes',
    type: 'Travel',
    premium: 2100,
    coverage: 150000,
    status: 'Pending',
    createdOn: new Date('2025-08-20'),
  },
  {
    id: 4,
    name: 'Angela Cruz',
    type: 'Business',
    premium: 15700,
    coverage: 1000000,
    status: 'Approved',
    createdOn: new Date('2025-09-01'),
  },
  {
    id: 5,
    name: 'Robert Chan',
    type: 'Life',
    premium: 9800,
    coverage: 400000,
    status: 'Rejected',
    createdOn: new Date('2025-09-10'),
  },
  {
    id: 6,
    name: 'Mia Lim',
    type: 'CPTL',
    premium: 21500,
    coverage: 1200000,
    status: 'Approved',
    createdOn: new Date('2025-09-12'),
  },
  {
    id: 7,
    name: 'Liam Tan',
    type: 'Travel',
    premium: 1800,
    coverage: 100000,
    status: 'Pending',
    createdOn: new Date('2025-09-15'),
  },
  {
    id: 8,
    name: 'Sophia Torres',
    type: 'Health',
    premium: 10200,
    coverage: 250000,
    status: 'In Review',
    createdOn: new Date('2025-09-20'),
  },
  {
    id: 9,
    name: 'Ethan Ramos',
    type: 'Business',
    premium: 14000,
    coverage: 900000,
    status: 'Approved',
    createdOn: new Date('2025-09-22'),
  },
  {
    id: 10,
    name: 'Isabella Perez',
    type: 'Life',
    premium: 8700,
    coverage: 350000,
    status: 'Pending',
    createdOn: new Date('2025-09-25'),
  },
  {
    id: 11,
    name: 'Noah Dizon',
    type: 'Health',
    premium: 7600,
    coverage: 280000,
    status: 'Rejected',
    createdOn: new Date('2025-09-30'),
  },
  {
    id: 12,
    name: 'Ava Mendoza',
    type: 'CPTL',
    premium: 19000,
    coverage: 1100000,
    status: 'Approved',
    createdOn: new Date('2025-10-01'),
  },
]

const quotationColumns: ColumnDef<Quotation>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'premium',
    header: 'Premium',
    cell: ({ row }) => `₱\t${row.original.premium.toFixed(2)}`,
  },
  {
    accessorKey: 'coverage',
    header: 'Coverage',
    cell: ({ row }) => `₱\t${row.original.coverage.toFixed(2)}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const color =
        status === 'Approved'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'In Review'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
            : status === 'Pending'
              ? { text: 'text-blue-600', bg: 'bg-blue-600' }
              : { text: 'text-red-600', bg: 'bg-red-600' }
      return (
        <div className="flex items-center gap-2">
          <div className={cn('size-2.5 rounded-full', color.bg)} />
          <span className={color.text}>{status.toUpperCase()}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdOn',
    header: 'Created On',
    cell: ({ row }) => new Date(row.original.createdOn).toLocaleDateString(),
  },
]

export default function QuotationPage() {
  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotations</h1>
        </div>
      </header>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <DataTable<Quotation, unknown>
            columns={quotationColumns}
            data={QUOTATIONS}
            searchKey="name"
            enableRowSelection
            actions={[
              {
                label: 'View Details',
                onClick: (client) => alert(`Viewing ${client.id}`),
              },
              {
                label: 'Delete',
                variant: 'destructive',
                onClick: (client) => alert(`Deleting ${client.name}`),
              },
            ]}
            onRowClick={(client) => console.log('Clicked row:', client)}
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  )
}
