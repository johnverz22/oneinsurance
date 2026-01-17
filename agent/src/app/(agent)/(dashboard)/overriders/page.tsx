'use client'

import { OverriderCard } from '@/components/agent/overrider-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { Overrider } from '@/types/agent/overrider'
import { formatPHPAmount } from '@/utils/formatter'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { TrendingDown, TrendingUp, User, Users2 } from 'lucide-react'

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
  { accessorKey: 'name' },
  { accessorKey: 'code' },
  { accessorKey: 'status' },
  { accessorKey: 'rank' },
  { accessorKey: 'recruited' },
  { accessorKey: 'lastSale' },
  { accessorKey: 'totalSales' },
  { accessorKey: 'salesCount' },
  { accessorKey: 'overrider_commission' },
  { accessorKey: 'upline_deduction' },
  { accessorKey: 'authorizedProducts' },
]

const OVERRIDER_PERFORMANCE_COLUMNS: ColumnDef<Overrider>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const { name, code } = row.original

      return (
        <div className="flex flex-col gap-0.5 py-4">
          <h3 className="font-bold">{name}</h3>
          <p className="text-muted-foreground">{code}</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status

      return (
        <Badge
          variant="secondary"
          className={cn(
            'px-3 py-1 text-sm',
            status === 'Active'
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
              : 'text-muted bg-muted-foreground'
          )}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'totalSales',
    header: 'Sales',
    cell: ({ row }) => {
      const { totalSales, salesCount } = row.original

      return (
        <div className="flex flex-col gap-0.5">
          <h3 className="font-bold">{formatPHPAmount(totalSales)}</h3>
          <p className="text-muted-foreground">{salesCount} sales</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'overrider_commission',
    header: 'Their Commission',
    cell: ({ row }) => {
      const overriderCommission = row.original.overrider_commission

      return (
        <p className="text-green-600">{formatPHPAmount(overriderCommission)}</p>
      )
    },
  },
  {
    accessorKey: 'upline_deduction',
    header: 'Your Share',
    cell: ({ row }) => {
      const uplineDeduction = row.original.upline_deduction

      return <p className="text-red-600">{formatPHPAmount(uplineDeduction)}</p>
    },
  },
  {
    accessorKey: 'lastSale',
    header: 'Last Active',
    cell: ({ row }) => {
      const lastSale = row.original.lastSale

      return <p className="font-medium">{format(new Date(lastSale), 'P')}</p>
    },
  },
]

const OverridersPage = () => {
  const totalOverriders = OVERRIDERS.length
  const activeOverriders = OVERRIDERS.filter((el) => el.status === 'Active')
  const totalSales = OVERRIDERS.reduce(
    (currentTotal, { totalSales }) => totalSales + currentTotal,
    0
  )
  const monthlyDeductions = OVERRIDERS.reduce(
    (currentTotal, { upline_deduction }) => upline_deduction + currentTotal,
    0
  )

  return (
    <div className="relative mx-auto space-y-6 overflow-hidden">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-row items-center gap-8 rounded-3xl px-12 py-5 shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 p-4">
            <Users2
              className="shrink-0 text-purple-300"
              fill="var(--color-purple-300)"
            />
          </div>
          <div>
            <h4 className="text-muted-foreground">Total Overriders</h4>
            <p className="text-lg text-purple-500 lg:text-xl">
              {totalOverriders ?? 0}
            </p>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-8 rounded-3xl px-12 py-5 shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 p-4">
            <User
              className="shrink-0 text-green-300"
              fill="var(--color-green-300)"
            />
          </div>
          <div>
            <h4 className="text-muted-foreground">Active Overriders</h4>
            <p className="text-lg text-green-500 lg:text-xl">
              {activeOverriders.length ?? 0}
            </p>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-8 rounded-3xl px-12 py-5 shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20 p-4">
            <TrendingUp
              className="shrink-0 text-orange-300"
              fill="var(--color-orange-300)"
            />
          </div>
          <div>
            <h4 className="text-muted-foreground">Total Sales Generated</h4>
            <p className="text-lg text-orange-500 lg:text-xl">
              {formatPHPAmount(totalSales)}
            </p>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-8 rounded-3xl px-12 py-5 shadow-2xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 p-4">
            <TrendingDown
              className="shrink-0 text-red-300"
              fill="var(--color-red-300)"
            />
          </div>
          <div>
            <h4 className="text-muted-foreground">Monthly Deductions</h4>
            <p className="text-lg text-red-500 lg:text-xl">
              {formatPHPAmount(monthlyDeductions)}
            </p>
          </div>
        </Card>
      </div>

      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <DataTable<Overrider, unknown>
          header="My Overriders"
          description="Manage your recruited agents and track their performance"
          data={OVERRIDERS}
          columns={OVERRIDER_COLUMNS}
          renderMode="list"
          numColumns={3}
          contentRenderer={(row) => <OverriderCard overrider={row.original} />}
          customAction={
            <Button className="h-11 min-w-32">Recruit New Agent</Button>
          }
          searchKey="name"
          actions={[]}
          onRowClick={(client) => {}}
        />
      </div>

      <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
        <DataTable<Overrider, unknown>
          header="Overrider Performance Summary"
          data={OVERRIDERS}
          columns={OVERRIDER_PERFORMANCE_COLUMNS}
          renderMode="table"
          searchKey="name"
          actions={[]}
          pageSize={5}
          onRowClick={(client) => {}}
        />
      </div>
    </div>
  )
}

export default OverridersPage
