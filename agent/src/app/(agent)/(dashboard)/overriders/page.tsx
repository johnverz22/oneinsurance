'use client'

import { useState } from 'react'
import { OverriderCard } from '@/components/agent/overrider-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Overrider } from '@/types/agent/overrider'
import { formatPHPAmount } from '@/utils/formatter'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  TrendingDown,
  TrendingUp,
  User,
  Users2,
  Search,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

// Mock data - will be replaced with API data
const MOCK_OVERRIDERS: Overrider[] = [
  {
    name: 'Maria Santos',
    code: 'ACT-015',
    status: 'Active',
    rank: 'Junior Agent',
    recruited: '2024-03-15',
    lastSale: '2024-11-05',
    totalSales: 280000,
    salesCount: 8,
    overrider_commission: 42000,
    upline_deduction: 15000,
    authorizedProducts: ['Travel Insurance', 'Medical/Health'],
  },
  {
    name: 'Luis Mendoza',
    code: 'ACT-022',
    status: 'Active',
    rank: 'Trainee Agent',
    recruited: '2024-05-20',
    lastSale: '2024-11-03',
    totalSales: 185000,
    salesCount: 5,
    overrider_commission: 27750,
    upline_deduction: 12000,
    authorizedProducts: ['Travel Insurance', 'Auto Protection'],
  },
  {
    name: 'Ana Reyes',
    code: 'ACT-031',
    status: 'Active',
    rank: 'New Agent',
    recruited: '2024-08-10',
    lastSale: '2024-11-01',
    totalSales: 95000,
    salesCount: 3,
    overrider_commission: 14250,
    upline_deduction: 8000,
    authorizedProducts: ['Life Insurance', 'General Lines'],
  },
  {
    name: 'Carlos Garcia',
    code: 'ACT-045',
    status: 'Inactive',
    rank: 'Junior Agent',
    recruited: '2024-09-15',
    lastSale: '2024-09-15',
    totalSales: 65000,
    salesCount: 2,
    overrider_commission: 9750,
    upline_deduction: 5000,
    authorizedProducts: ['Travel Insurance'],
  },
  {
    name: 'Rosa Ferna',
    code: 'ACT-052',
    status: 'Training',
    rank: 'Trainee Agent',
    recruited: '2024-10-25',
    lastSale: '2024-10-25',
    totalSales: 15000,
    salesCount: 1,
    overrider_commission: 2250,
    upline_deduction: 1500,
    authorizedProducts: ['Travel Insurance'],
  },
]

const OverridersPage = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [overriders] = useState<Overrider[]>(MOCK_OVERRIDERS)

  // Filter overriders based on search
  const filteredOverriders = overriders.filter(
    (overrider) =>
      overrider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      overrider.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      overrider.rank.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate statistics
  const totalOverriders = overriders.length
  const activeOverriders = overriders.filter(
    (el) => el.status === 'Active'
  ).length
  const totalSales = overriders.reduce(
    (sum, { totalSales }) => sum + totalSales,
    0
  )
  const monthlyDeductions = overriders.reduce(
    (sum, { upline_deduction }) => sum + upline_deduction,
    0
  )

  // Performance table columns
  const performanceColumns: ColumnDef<Overrider>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const { name, code } = row.original
        return (
          <div className="flex flex-col gap-0.5 py-2">
            <p className="font-semibold">{name}</p>
            <p className="text-muted-foreground text-xs">{code}</p>
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
              'px-3 py-1 text-xs font-medium rounded-md',
              status === 'Active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : status === 'Training'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
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
            <p className="font-semibold">{formatPHPAmount(totalSales)}</p>
            <p className="text-muted-foreground text-xs">{salesCount} sales</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'overrider_commission',
      header: 'Their Commission',
      cell: ({ row }) => {
        const commission = row.original.overrider_commission
        return (
          <p className="font-semibold text-green-600">
            {formatPHPAmount(commission)}
          </p>
        )
      },
    },
    {
      accessorKey: 'upline_deduction',
      header: 'Your Share',
      cell: ({ row }) => {
        const share = row.original.upline_deduction
        return (
          <p className="font-semibold text-red-600">{formatPHPAmount(share)}</p>
        )
      },
    },
    {
      accessorKey: 'lastSale',
      header: 'Last Active',
      cell: ({ row }) => {
        const lastSale = row.original.lastSale
        try {
          return (
            <p className="text-sm">
              {format(new Date(lastSale), 'MM/dd/yyyy')}
            </p>
          )
        } catch {
          return <p className="text-sm">{lastSale}</p>
        }
      },
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuItem>Manage</DropdownMenuItem>
              <DropdownMenuItem>More details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleRecruitNewAgent = () => {
    // TODO: Navigate to recruitment page when available
    console.log('Navigate to recruitment page')
  }

  return (
    <div className="relative mx-auto space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-row items-center gap-6 rounded-3xl px-8 py-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Users2 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Total Overriders</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalOverriders}
            </p>
          </div>
        </Card>

        <Card className="flex flex-row items-center gap-6 rounded-3xl px-8 py-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <User className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Active Overriders</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeOverriders}
            </p>
          </div>
        </Card>

        <Card className="flex flex-row items-center gap-6 rounded-3xl px-8 py-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <TrendingUp className="h-7 w-7 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              Total Sales Generated
            </p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatPHPAmount(totalSales)}
            </p>
          </div>
        </Card>

        <Card className="flex flex-row items-center gap-6 rounded-3xl px-8 py-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <TrendingDown className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Monthly Deduction</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatPHPAmount(monthlyDeductions)}
            </p>
          </div>
        </Card>
      </div>

      {/* My Overriders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Overriders</h2>
            <p className="text-muted-foreground text-sm">
              Manage your recruited agents and track their performance
            </p>
          </div>
        </div>

        {/* Search and Recruit Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Overrider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={handleRecruitNewAgent}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Recruit New Agent
          </Button>
        </div>

        {/* Overrider Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOverriders.length > 0 ? (
            filteredOverriders.map((overrider) => (
              <OverriderCard
                key={overrider.code}
                overrider={overrider}
                onViewDetails={() =>
                  console.log('View details:', overrider.code)
                }
                onContact={() => console.log('Contact:', overrider.code)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No overriders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary Table */}
      <div className="border-muted-foreground/20 rounded-xl border">
        <DataTable<Overrider, unknown>
          header="Overrider Performance Summary"
          data={filteredOverriders}
          columns={performanceColumns}
          renderMode="table"
          searchKey="name"
          actions={[]}
          pageSize={5}
          onRowClick={() => {}}
        />
      </div>
    </div>
  )
}

export default OverridersPage
