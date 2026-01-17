'use client'

import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { SummaryCard } from '@/components/dashboard/policy-summary'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { COMMISSIONS, monthlyPerformanceData } from '@/constants/commissions'
import { ColumnDef } from '@tanstack/react-table'
import { Commission } from '@/types/commission'
import { cn } from '@/lib/utils'
import { createSortableHeader, DataTable } from '@/components/ui/data-table'
import { PRIMARY, SECONDARY, TERTIARY } from '@/components/colors'
import { formatPHPAmount } from '@/utils/formatter'
import { format } from 'date-fns'
import CommissionBreakdownDialog from '@/components/agent/commission-breakdown'

const COMMISSION_COLUMNS: ColumnDef<Commission>[] = [
  {
    accessorKey: 'sourceDetails',
    header: 'Commission Source',
  },
  {
    accessorKey: 'amount',
    header: 'Policy Amount',
    cell: ({ row }) => (
      <p className="font-semibold">{formatPHPAmount(row.original.amount)}</p>
    ),
  },
  {
    accessorKey: 'grossCommission',
    header: 'Gross Commission',
    cell: ({ row }) => (
      <p className="font-semibold text-green-600">
        {formatPHPAmount(row.original.grossCommission)}
      </p>
    ),
  },
  {
    accessorKey: 'deductions',
    header: 'Deductions',
    cell: ({ row }) => (
      <p className="font-semibold text-red-600">
        -{formatPHPAmount(row.original.deductions)}
      </p>
    ),
  },
  {
    accessorKey: 'netCommission',
    header: 'Net Commission',
    cell: ({ row }) => (
      <p className="font-semibold text-blue-600">
        {formatPHPAmount(row.original.netCommission)}
      </p>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const statusClasses = {
        Paid: 'bg-green-100 text-green-800',
        Approved: 'bg-blue-100 text-blue-800',
        Pending: 'bg-yellow-100 text-yellow-800',
      }
      return (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
  },
  {
    accessorKey: 'paidOn',
    header: 'Paid On',
    cell: ({ row }) => (
      <p className="font-semibold">{format(row.original.paidOn, 'P')}</p>
    ),
  },
]
export default function CommissionPage() {
  const [selectedCommission, setSelectedCommission] =
    useState<Commission | null>(null)

  const totalGrossCommission = COMMISSIONS.reduce(
    (sum, c) => sum + c.grossCommission,
    0
  )
  const totalDeductions = COMMISSIONS.reduce((sum, c) => sum + c.deductions, 0)
  const totalNetCommission = COMMISSIONS.reduce(
    (sum, c) => sum + c.netCommission,
    0
  )

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Commissions</h1>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={DollarSign}
          title="Total Commission"
          value={formatPHPAmount(totalGrossCommission)}
        />
        <SummaryCard
          icon={TrendingDown}
          title="Total Deductions"
          value={formatPHPAmount(totalDeductions)}
        />
        <SummaryCard
          icon={TrendingUp}
          title="Total Net Commission"
          value={formatPHPAmount(totalNetCommission)}
        />
        <SummaryCard icon={Users} title="New Client this Month" value={54} />
      </div>

      {/* Charts Grid */}
      {/* <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>Monthly Performance</CardHeader>

          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={monthlyPerformanceData}
                  // margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="colorCommission"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="0"
                    >
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
                    itemStyle={{ color: '#4f46e5' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#colorCommission)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div> */}

      <div className="border-muted-foreground/20 bg-card rounded-xl border px-8 py-3.5">
        <DataTable<Commission, unknown>
          header="Commission History"
          description="View all your commissions and their breakdown"
          data={COMMISSIONS}
          columns={COMMISSION_COLUMNS}
          renderMode="table"
          searchKey={['sourceDetails', 'status']}
          pageSize={10}
          onRowClick={(commission) => setSelectedCommission(commission)}
        />
      </div>

      {/* Breakdown Dialog */}
      {selectedCommission && (
        <CommissionBreakdownDialog
          commission={selectedCommission}
          onClose={() => setSelectedCommission(null)}
        />
      )}
    </div>
  )
}
