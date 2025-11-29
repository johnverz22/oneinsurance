'use client'

import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { formatPHPAmount } from '@/utils/formatter'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MySale } from '@/types/agent/sales'
import { cn } from '@/lib/utils'

const MY_SALES: MySale[] = [
  {
    id: 'S-001',
    product: 'Life',
    customer: 'Juan Dela Cruz',
    totalSales: 55000,
    commission: 5500,
    date: new Date('2025-01-12'),
    status: 'Paid',
  },
  {
    id: 'S-002',
    product: 'Health',
    customer: 'Maria Santos',
    totalSales: 32000,
    commission: 3200,
    date: new Date('2025-02-04'),
    status: 'Pending',
  },
  {
    id: 'S-003',
    product: 'Business',
    customer: 'ABC Trading Corp.',
    totalSales: 120000,
    commission: 15000,
    date: new Date('2025-01-28'),
    status: 'Paid',
  },
  {
    id: 'S-004',
    product: 'Travel',
    customer: 'Mark Reyes',
    totalSales: 15000,
    commission: 1200,
    date: new Date('2025-03-01'),
    status: 'New',
  },
  {
    id: 'S-005',
    product: 'CPTL',
    customer: 'Global Ventures Inc.',
    totalSales: 78000,
    commission: 7800,
    date: new Date('2025-01-20'),
    status: 'Pending',
  },
  {
    id: 'S-006',
    product: 'Life',
    customer: 'Ana Robles',
    totalSales: 45000,
    commission: 4500,
    date: new Date('2025-03-10'),
    status: 'Paid',
  },
  {
    id: 'S-007',
    product: 'Health',
    customer: 'Victor Bautista',
    totalSales: 27000,
    commission: 2700,
    date: new Date('2025-02-15'),
    status: 'New',
  },
  {
    id: 'S-008',
    product: 'Travel',
    customer: 'Stephanie Cruz',
    totalSales: 18000,
    commission: 1500,
    date: new Date('2025-03-03'),
    status: 'Paid',
  },
  {
    id: 'S-009',
    product: 'Business',
    customer: 'Prime Solutions PH',
    totalSales: 98000,
    commission: 12000,
    date: new Date('2025-02-22'),
    status: 'Pending',
  },
  {
    id: 'S-010',
    product: 'CPTL',
    customer: 'Metro Holdings',
    totalSales: 65000,
    commission: 6500,
    date: new Date('2025-01-18'),
    status: 'New',
  },
  {
    id: 'S-011',
    product: 'Life',
    customer: 'Catherine Go',
    totalSales: 39000,
    commission: 3900,
    date: new Date('2025-03-12'),
    status: 'Pending',
  },
  {
    id: 'S-012',
    product: 'Health',
    customer: 'Jerson Tan',
    totalSales: 22000,
    commission: 2200,
    date: new Date('2025-02-09'),
    status: 'Paid',
  },
  {
    id: 'S-013',
    product: 'Travel',
    customer: 'Kyle Mendoza',
    totalSales: 13000,
    commission: 1000,
    date: new Date('2025-03-05'),
    status: 'Pending',
  },
  {
    id: 'S-014',
    product: 'Business',
    customer: 'NorthPeak Logistics',
    totalSales: 150000,
    commission: 18000,
    date: new Date('2025-01-30'),
    status: 'Paid',
  },
  {
    id: 'S-015',
    product: 'CPTL',
    customer: 'Sunrise Enterprises',
    totalSales: 72000,
    commission: 7200,
    date: new Date('2025-02-12'),
    status: 'Pending',
  },
]

const columns: ColumnDef<MySale>[] = [
  {
    accessorKey: 'product',
    header: 'Product',
    cell: ({ row }) => <p className="font-bold">{row.original.product}</p>,
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
  },
  {
    accessorKey: 'totalSales',
    header: 'Total Sales',
    cell: ({ row }) => (
      <p className="font-semibold">
        {formatPHPAmount(row.original.totalSales)}
      </p>
    ),
  },
  {
    accessorKey: 'commission',
    header: 'Commission',
    cell: ({ row }) => (
      <p className="font-semibold text-green-600">
        {formatPHPAmount(row.original.commission)}
      </p>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <p className="font-semibold">{format(row.original.date, 'P')}</p>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const color =
        status === 'Paid'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'Pending'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
            : { text: 'text-gray-600', bg: 'bg-gray-600' }
      return (
        <Badge variant="secondary" className="flex items-center gap-2">
          <div className={cn('size-2.5 rounded-full', color.bg)} />
          <span className={color.text}>{status.toUpperCase()}</span>
        </Badge>
      )
    },
  },
]

const MySalesPage = () => {
  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <DataTable<MySale, unknown>
        header="My Sales"
        data={MY_SALES}
        columns={columns}
        renderMode="table"
        searchKey={['customer', 'product']}
        actions={[]}
        pageSize={5}
        onRowClick={(client) => console.log('Clicked row:', client)}
        customAction={<Button className="h-11 min-w-32">New Sale</Button>}
      />
    </div>
  )
}

export default MySalesPage
