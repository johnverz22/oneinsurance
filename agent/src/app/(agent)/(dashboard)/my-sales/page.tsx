'use client'

import { toast } from 'sonner'
import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { useSearchTransactions } from '@/app/data/mutations/agent/transactions'
import { TransactionsResponse, Transaction } from '@/types/agent/transactions'
import { DataTable, PaginatedResponse } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import MetricsCard from '@/components/dashboard/metrics-card'
import { useGetAgentStatistics } from '@/app/data/queries/statistics'
import { DollarSign, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'proposal_number',
    header: 'Proposal Number',
    cell: ({ row }) => (
      <p className="font-medium">{row.original.proposal_number}</p>
    ),
  },
  {
    accessorKey: 'policy_id',
    header: 'Policy ID',
    cell: ({ row }) => <p className="font-medium">{row.original.policy_id}</p>,
  },
  {
    accessorKey: 'customer_id',
    header: 'Customer ID',
    cell: ({ row }) => (
      <p className="text-muted-foreground">
        {row.original.customer_id ?? 'N/A'}
      </p>
    ),
  },
  {
    accessorKey: 'merchant_transaction_id',
    header: 'Transaction ID',
    cell: ({ row }) => (
      <p className="text-muted-foreground">
        {row.original.merchant_transaction_id ?? 'N/A'}
      </p>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <p className="font-semibold">
        {row.original.amount
          ? `₱${row.original.amount.toLocaleString()}`
          : 'N/A'}
      </p>
    ),
  },
  {
    accessorKey: 'commission_log.gross_commission',
    header: 'Gross Commission',
    cell: ({ row }) => {
      const grossCommission = row.original.commission_log?.gross_commission
      const value = grossCommission ? parseFloat(grossCommission) : 0
      return (
        <p className="font-semibold">
          ₱{value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      )
    },
  },
  {
    accessorKey: 'commission_log.net_commission',
    header: 'Net Commission',
    cell: ({ row }) => {
      const netCommission = row.original.commission_log?.net_commission
      const value = netCommission ? parseFloat(netCommission) : 0
      return (
        <p className="font-semibold">
          ₱{value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const color =
        status === 'completed'
          ? { text: 'text-green-600', bg: 'bg-green-600' }
          : status === 'pending'
            ? { text: 'text-yellow-600', bg: 'bg-yellow-600' }
            : status === 'failed'
              ? { text: 'text-red-600', bg: 'bg-red-600' }
              : { text: 'text-gray-600', bg: 'bg-gray-600' }

      return (
        <Badge variant="secondary" className="flex w-fit items-center gap-2">
          <div className={cn('size-2.5 rounded-full', color.bg)} />
          <span className={color.text}>{status.toUpperCase()}</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: 'transaction_date',
    header: 'Timestamp',
    cell: ({ row }) => (
      <p className="text-sm">
        {row.original.transaction_date
          ? new Date(row.original.transaction_date).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'N/A'}
      </p>
    ),
  },
]

const MySalesPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(10)

  const {
    data: transactionsResponse,
    isLoading,
    refetch,
  } = useGetTransactions(currentPage, currentPageSize)

  // const { data: statistics, isLoading: isLoadingStats } =
  //   useGetAgentStatistics()

  const { mutateAsync: searchTransactions, isPending: isSearching } =
    useSearchTransactions()

  const [searchedTransactions, setSearchedTransactions] =
    useState<TransactionsResponse | null>(null)

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchedTransactions(null)
      return
    }

    try {
      const result = await searchTransactions({ keyword })
      setSearchedTransactions(result)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Error searching transactions'
      )
    }
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setCurrentPageSize(pageSize)

    try {
      sessionStorage.setItem('transactions.currentPage', String(page))
    } catch (e) {}
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      setSearchedTransactions(null)
      toast.success('Transactions refreshed')
    } catch (e: any) {
      toast.error('Failed to refresh transactions')
    }
  }

  const displayData = searchedTransactions || transactionsResponse

  return (
    <div className="relative mx-auto w-full space-y-6">
      {/* Statistics Cards - Temporarily Hidden */}
      {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </>
        ) : statistics ? (
          <>
            <MetricsCard
              title="Total Sales"
              icon={DollarSign}
              value={formatCurrency(statistics.total_sales)}
              change="+0%"
              changeType={true}
            />
            <MetricsCard
              title="Number of Sales"
              icon={ShoppingCart}
              value={statistics.number_of_sales.toString()}
              change="+0%"
              changeType={true}
            />
            <MetricsCard
              title="Gross Commissions"
              icon={TrendingUp}
              value={formatCurrency(statistics.gross_commissions)}
              change="+0%"
              changeType={true}
            />
            <MetricsCard
              title="Net Commissions"
              icon={Wallet}
              value={formatCurrency(statistics.net_commissions)}
              change="+0%"
              changeType={true}
            />
          </>
        ) : null}
      </div> */}

      <DataTable
        header="Transaction History"
        description="View and manage all your transactions"
        data={displayData?.data?.data ?? []}
        columns={transactionColumns}
        renderMode="table"
        searchKey={['proposal_number', 'policy_id', 'customer_id']}
        searchPlaceholder="proposal number, policy ID, or customer ID"
        isLoading={isLoading || isSearching}
        alternateColors
        pagination={
          displayData?.data
            ? {
                enabled: true,
                paginatedResponse: displayData.data,
                onPaginationChange: handlePaginationChange,
                onSearchChange: handleSearch,
              }
            : { enabled: false }
        }
      />
    </div>
  )
}

export default MySalesPage
