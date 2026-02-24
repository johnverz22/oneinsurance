'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatPHPAmount } from '@/utils/formatter'
import { Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

// Team Sale type based on overrider sales
type TeamSale = {
  id: string
  customer: string
  product: string
  amount: number
  theirCommission: number
  yourDeduction: number
  date: string
  agentName: string
  agentCode: string
}

// Mock data - Generate sales from overriders
const MOCK_TEAM_SALES: TeamSale[] = [
  {
    id: '1',
    customer: 'Ana Garcia',
    product: 'Travel Insurance',
    amount: 280000,
    theirCommission: 42000,
    yourDeduction: 15000,
    date: '2024-11-01',
    agentName: 'Maria Santos',
    agentCode: 'ACT-015',
  },
  {
    id: '2',
    customer: 'Mark Santos',
    product: 'Medical/Health',
    amount: 95000,
    theirCommission: 14250,
    yourDeduction: 10000,
    date: '2024-10-29',
    agentName: 'Luis Mendoza',
    agentCode: 'ACT-022',
  },
  {
    id: '3',
    customer: 'Roberto Silva',
    product: 'General Lines',
    amount: 100000,
    theirCommission: 10000,
    yourDeduction: 8000,
    date: '2024-10-18',
    agentName: 'Ana Reyes',
    agentCode: 'ACT-031',
  },
  {
    id: '4',
    customer: 'Richie Martinez',
    product: 'Travel Insurance',
    amount: 80000,
    theirCommission: 60000,
    yourDeduction: 12000,
    date: '2024-09-15',
    agentName: 'Maria Santos',
    agentCode: 'ACT-015',
  },
  {
    id: '5',
    customer: 'Feliz Tan',
    product: 'General Lines',
    amount: 40000,
    theirCommission: 30000,
    yourDeduction: 5000,
    date: '2024-08-01',
    agentName: 'Carlos Garcia',
    agentCode: 'ACT-045',
  },
]

const TeamSalesPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [teamSales] = useState<TeamSale[]>(MOCK_TEAM_SALES)

  // Filter sales based on search
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return teamSales

    const query = searchQuery.toLowerCase()
    return teamSales.filter(
      (sale) =>
        sale.customer.toLowerCase().includes(query) ||
        sale.product.toLowerCase().includes(query) ||
        sale.agentName.toLowerCase().includes(query) ||
        sale.agentCode.toLowerCase().includes(query)
    )
  }, [teamSales, searchQuery])

  // Calculate total deductions
  const totalDeductions = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.yourDeduction, 0)
  }, [filteredSales])

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Sales Table Card */}
      <Card className="overflow-hidden p-6">
        {/* Page Header and Search Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Sales (Overriders)</h1>
            <p className="text-muted-foreground text-sm">
              Sales from your recruited overriders
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Agent or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table Content - No borders, card style */}
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm font-semibold text-muted-foreground">
            <div>Customer</div>
            <div>Product</div>
            <div>Amount</div>
            <div>Their Commission</div>
            <div>Your Deduction</div>
            <div>Date</div>
          </div>

          {/* Table Rows */}
          {filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="grid grid-cols-6 gap-4 rounded-lg bg-white dark:bg-gray-800 px-4 py-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-medium">{sale.customer}</div>
                <div className="font-medium">{sale.product}</div>
                <div className="font-semibold">{formatPHPAmount(sale.amount)}</div>
                <div className="font-semibold text-green-600">
                  {formatPHPAmount(sale.theirCommission)}
                </div>
                <div className="font-semibold text-red-600">
                  {formatPHPAmount(sale.yourDeduction)}
                </div>
                <div className="text-sm">
                  {format(new Date(sale.date), 'MM/dd/yyyy')}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No sales found
            </div>
          )}
        </div>
      </Card>

      {/* Total Deductions Summary */}
      <Card className="bg-gray-50 dark:bg-gray-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Total Overrider Deductions:</h3>
            <p className="text-muted-foreground text-sm">
              This amount is deducted from your gross commission when your overriders make sales.
            </p>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {formatPHPAmount(totalDeductions)}
          </p>
        </div>
      </Card>
    </div>
  )
}

export default TeamSalesPage
