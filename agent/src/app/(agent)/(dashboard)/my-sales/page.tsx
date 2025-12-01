'use client'

import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { formatPHPAmount } from '@/utils/formatter'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MySale } from '@/types/agent/sales'
import { cn } from '@/lib/utils'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { TransactionDataTable } from '@/components/transactions/transaction-data-table'
import { useSearchTransactions } from '@/app/data/mutations/agent/transactions'
import { toast } from 'sonner'
import { TransactionsResponse } from '@/types/agent/transactions'

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
  const [currentPage, setCurrentPage] = useState(1)
  // Initialize current page from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('transactions.currentPage')
      if (saved) {
        const p = Number(saved)
        if (!isNaN(p) && p > 0) setCurrentPage(p)
      }
    } catch (e) {}
  }, [])

  const {
    data: transactionsResponse,
    isLoading,
    refetch,
  } = useGetTransactions(currentPage)
  const { mutateAsync: searchTractions } = useSearchTransactions()
  const [searchedTransactions, setSearchedTransactions] =
    useState<TransactionsResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (keyword: string) => {
    try {
      setIsSearching(true)
      const result = await searchTractions({ keyword })
      setSearchedTransactions(result)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Error searching transactions'
      )
    } finally {
      setIsSearching(false)
    }
  }

  // update current page when pagination control requests a change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    try {
      sessionStorage.setItem('transactions.currentPage', String(page))
    } catch (e) {}
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Transactions refreshed')
    } catch (e: any) {
      toast.error('Failed to refresh transactions')
    }
  }

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Header */}
      <header className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <div className="mt-3 sm:mt-0">
          <button
            className="inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
            onClick={handleRefresh}
            disabled={isLoading || isSearching}
          >
            Refresh
          </button>
        </div>
      </header>

      <Card className="bg-background shadow-sm">
        <CardContent className="p-6">
          <TransactionDataTable
            data={searchedTransactions?.data || transactionsResponse?.data}
            isLoading={isLoading || isSearching}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onClearSearch={() => setSearchedTransactions(null)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default MySalesPage
