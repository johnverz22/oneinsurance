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
} from 'lucide-react'
import { SummaryCard } from '@/components/dashboard/policy-summary'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { COMMISSIONS, monthlyPerformanceData } from '@/constants/commissions'
import { ColumnDef } from '@tanstack/react-table'
import { Commission } from '@/types/commission'
import { cn } from '@/lib/utils'
import { createSortableHeader, DataTable } from '@/components/ui/data-table'
import { PRIMARY, SECONDARY, TERTIARY } from '@/components/colors'

const commissionColumns: ColumnDef<Commission>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'policyId', header: 'Policy ID' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'commission',
    header: 'Commission',
    cell: ({ row }) => `₱\t${row.original.commission.toFixed(2)}`,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => createSortableHeader('Status', column),
    cell: ({ row }) => {
      const status = row.original.status
      const color =
        status === 'Paid'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'Pending'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
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
    accessorKey: 'paidOn',
    header: 'Paid On',
    cell: ({ row }) => new Date(row.original.paidOn).toLocaleDateString(),
  },
]

export default function CommissionPage() {
  const totalCommision = 1_234_533
  const commissionThisMonth = 20_322
  const policiesSold = 2

  const commissionByType = useMemo(() => {
    const data = COMMISSIONS.reduce(
      (acc, item) => {
        if (item.status !== 'Paid') return acc
        if (!acc[item.type]) {
          acc[item.type] = 0
        }
        acc[item.type] += item.commission
        return acc
      },
      {} as Record<string, number>
    )
    return Object.entries(data).map(([name, commission]) => ({
      name,
      commission,
    }))
  }, [])

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
          value={`PHP ${totalCommision.toLocaleString()}`}
        />
        <SummaryCard
          icon={TrendingUp}
          title="Commision this Month"
          value={`PHP ${commissionThisMonth.toLocaleString()}`}
        />
        <SummaryCard
          icon={FileText}
          title="Policy Sold this Month"
          value={policiesSold}
        />
        <SummaryCard icon={Users} title="New Client this Month" value={54} />
      </div>

      {/* Charts Grid */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
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
        <Card className="lg:col-span-2">
          <CardHeader>Commission by Type</CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={commissionByType}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="colorCommissionByType"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={1} />
                      <stop
                        offset="95%"
                        stopColor={SECONDARY}
                        stopOpacity={1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    vertical={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="commission"
                    fill="url(#colorCommissionByType)"
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <DataTable<Commission, unknown>
            columns={commissionColumns}
            data={COMMISSIONS}
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
