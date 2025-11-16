'use client'

import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { formatPHPAmount } from '@/utils/formatter'
import { TeamSale } from '@/types/agent/sales'

const TEAM_SALES: TeamSale[] = [
  {
    id: 'T-001',
    customer: 'Lara Dela Cruz',
    product: 'Life',
    totalSales: 42000,
    overrider_commission: 3000,
    upline_deduction: 1500,
    date: new Date('2025-01-10'),
  },
  {
    id: 'T-002',
    customer: 'Kevin Santos',
    product: 'Health',
    totalSales: 28000,
    overrider_commission: 2000,
    upline_deduction: 1000,
    date: new Date('2025-01-15'),
  },
  {
    id: 'T-003',
    customer: 'Olivia Tan',
    product: 'Travel',
    totalSales: 15000,
    overrider_commission: 800,
    upline_deduction: 400,
    date: new Date('2025-01-20'),
  },
  {
    id: 'T-004',
    customer: 'Metro Foods Corp.',
    product: 'Business',
    totalSales: 95000,
    overrider_commission: 6000,
    upline_deduction: 3000,
    date: new Date('2025-01-25'),
  },
  {
    id: 'T-005',
    customer: 'Sunrise Realty',
    product: 'CPTL',
    totalSales: 70000,
    overrider_commission: 5000,
    upline_deduction: 2500,
    date: new Date('2025-01-30'),
  },
  {
    id: 'T-006',
    customer: 'Patricia Uy',
    product: 'Life',
    totalSales: 38000,
    overrider_commission: 2500,
    upline_deduction: 1200,
    date: new Date('2025-02-02'),
  },
  {
    id: 'T-007',
    customer: 'Horizon Logistics',
    product: 'Business',
    totalSales: 110000,
    overrider_commission: 7500,
    upline_deduction: 3800,
    date: new Date('2025-02-10'),
  },
  {
    id: 'T-008',
    customer: 'Nina Robles',
    product: 'Health',
    totalSales: 26000,
    overrider_commission: 1800,
    upline_deduction: 900,
    date: new Date('2025-02-14'),
  },
  {
    id: 'T-009',
    customer: 'Travel PH Group',
    product: 'Travel',
    totalSales: 20000,
    overrider_commission: 1000,
    upline_deduction: 500,
    date: new Date('2025-02-18'),
  },
  {
    id: 'T-010',
    customer: 'Global Mining Corp.',
    product: 'CPTL',
    totalSales: 85000,
    overrider_commission: 6000,
    upline_deduction: 3200,
    date: new Date('2025-02-25'),
  },
  {
    id: 'T-011',
    customer: 'Adrian Sarmiento',
    product: 'Life',
    totalSales: 39000,
    overrider_commission: 2600,
    upline_deduction: 1300,
    date: new Date('2025-03-01'),
  },
  {
    id: 'T-012',
    customer: 'TechWave Solutions',
    product: 'Business',
    totalSales: 102000,
    overrider_commission: 7000,
    upline_deduction: 3500,
    date: new Date('2025-03-03'),
  },
  {
    id: 'T-013',
    customer: 'CarePlus Clinic',
    product: 'Health',
    totalSales: 30000,
    overrider_commission: 2100,
    upline_deduction: 1050,
    date: new Date('2025-03-07'),
  },
  {
    id: 'T-014',
    customer: 'Outdoor Adventurers PH',
    product: 'Travel',
    totalSales: 17000,
    overrider_commission: 900,
    upline_deduction: 450,
    date: new Date('2025-03-09'),
  },
  {
    id: 'T-015',
    customer: 'Evergreen Properties',
    product: 'CPTL',
    totalSales: 68000,
    overrider_commission: 4800,
    upline_deduction: 2400,
    date: new Date('2025-03-12'),
  },
]

const TEAM_SALES_COLUMNS: ColumnDef<TeamSale>[] = [
  {
    accessorKey: 'product',
    header: 'Product',
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
  },
  {
    accessorKey: 'totalSales',
    header: 'Amount',
    cell: ({ row }) => (
      <p className="font-semibold">
        {formatPHPAmount(row.original.totalSales)}
      </p>
    ),
  },
  {
    accessorKey: 'overrider_commission',
    header: 'Their Commission',
    cell: ({ row }) => (
      <p className="font-semibold text-green-600">
        -{formatPHPAmount(row.original.overrider_commission)}
      </p>
    ),
  },
  {
    accessorKey: 'upline_deduction',
    header: 'Your Commission',
    cell: ({ row }) => (
      <p className="font-semibold text-red-600">
        -{formatPHPAmount(row.original.upline_deduction)}
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
]

const TeamSalesPage = () => {
  return (
    <div className="border-muted-foreground/20 rounded-xl border px-6 py-3.5">
      <DataTable<TeamSale, unknown>
        header="Team Sales (Overriders)"
        description="Sales from your recruited overriders"
        data={TEAM_SALES}
        columns={TEAM_SALES_COLUMNS}
        renderMode="table"
        searchKey="product"
        actions={[]}
        pageSize={5}
        onRowClick={(client) => console.log('Clicked row:', client)}
      />
    </div>
  )
}

export default TeamSalesPage
