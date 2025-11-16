'use client'

import { OverriderCard } from '@/components/agent/overrider-card'
import { DataTable } from '@/components/ui/data-table'
import { Overrider } from '@/types/agent/overrider'
import { ColumnDef } from '@tanstack/react-table'

const OVERRIDERS: Overrider[] = [
  {
    name: 'Alice Santos',
    code: 'OV-001',
    status: 'Active',
    rank: 'Gold',
    recruited: '2024-01-15',
    lastSale: '2025-11-10',
    totalSales: 150000,
    salesCount: 12,
    overrider_commission: 5000,
    upline_deduction: 1000,
    authorizedProducts: ['Life', 'Health'],
  },
  {
    name: 'Brian Cruz',
    code: 'OV-002',
    status: 'Active',
    rank: 'Silver',
    recruited: '2024-03-22',
    lastSale: '2025-11-12',
    totalSales: 95000,
    salesCount: 8,
    overrider_commission: 3200,
    upline_deduction: 800,
    authorizedProducts: ['Life'],
  },
  {
    name: 'Catherine Reyes',
    code: 'OV-003',
    status: 'Inactive',
    rank: 'Bronze',
    recruited: '2023-11-05',
    lastSale: '2025-09-18',
    totalSales: 47000,
    salesCount: 5,
    overrider_commission: 1200,
    upline_deduction: 400,
    authorizedProducts: ['Health'],
  },
  {
    name: 'Daniel Lim',
    code: 'OV-004',
    status: 'Active',
    rank: 'Gold',
    recruited: '2024-06-10',
    lastSale: '2025-11-14',
    totalSales: 180000,
    salesCount: 15,
    overrider_commission: 6000,
    upline_deduction: 1200,
    authorizedProducts: ['Life', 'Health', 'Travel'],
  },
  {
    name: 'Erika Mendoza',
    code: 'OV-005',
    status: 'Active',
    rank: 'Silver',
    recruited: '2024-08-01',
    lastSale: '2025-11-11',
    totalSales: 102000,
    salesCount: 9,
    overrider_commission: 3400,
    upline_deduction: 900,
    authorizedProducts: ['Travel'],
  },
]

const OVERRIDER_COLUMNS: ColumnDef<Overrider>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'code',
    header: 'Code',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'rank',
    header: 'Rank',
  },
  {
    accessorKey: 'recruited',
    header: 'Recruited',
  },
  {
    accessorKey: 'lastSale',
    header: 'Last Sale',
  },
  {
    accessorKey: 'totalSales',
    header: 'Total Sales',
  },
  {
    accessorKey: 'salesCount',
    header: 'Sales Count',
  },
  {
    accessorKey: 'overrider_commission',
    header: 'Overrider Commission',
  },
  {
    accessorKey: 'upline_deduction',
    header: 'Upline Deduction',
  },
  {
    accessorKey: 'authorizedProducts',
    header: 'Authorized Products',
  },
]

const OverridersPage = () => {
  return (
    <div className="border-muted-foreground/20 rounded-xl border px-6 py-3.5">
      <DataTable<Overrider, unknown>
        header="My Overriders"
        description="Manage your recruited agents and track their performance"
        data={OVERRIDERS}
        columns={OVERRIDER_COLUMNS}
        renderMode="list"
        containerClassName="grid md:grid-cols-2 lg:grid-cols-3"
        contentRenderer={(row) => <OverriderCard {...row.original} />}
        searchKey="name"
        actions={[]}
        pageSize={5}
        onRowClick={(client) => console.log('Clicked row:', client)}
      />
    </div>
  )
}

export default OverridersPage
