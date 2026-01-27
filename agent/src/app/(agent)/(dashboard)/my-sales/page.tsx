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
import { DollarSign, ShoppingCart, TrendingUp, Wallet, Calendar, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'

const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'proposal_number',
    header: 'Proposal No.',
    cell: ({ row }) => (
      <p className="font-medium">{row.original.proposal_number}</p>
    ),
  },
  {
    accessorKey: 'policy_id',
    header: 'Policy No./Certificate No.',
    cell: ({ row }) => {
      // Try to get CarrierPolicyNo from policy_details
      const transactionWithDetails = row.original as Transaction & { policy_details?: string };
      if (transactionWithDetails.policy_details) {
        try {
          const policyDetails = typeof transactionWithDetails.policy_details === 'string' 
            ? JSON.parse(transactionWithDetails.policy_details) 
            : transactionWithDetails.policy_details;
          
          if (policyDetails?.CarrierPolicyNo) {
            return <p className="font-medium">{policyDetails.CarrierPolicyNo}</p>;
          }
        } catch (e) {
          console.log('Failed to parse policy_details for CarrierPolicyNo:', e);
        }
      }
      
      // Fallback to policy_id
      return <p className="font-medium">{row.original.policy_id}</p>;
    },
  },
  {
    accessorKey: 'merchant_transaction_id',
    header: 'Payment ID',
    cell: ({ row }) => (
      <p className="text-muted-foreground">
        {row.original.merchant_transaction_id ?? 'N/A'}
      </p>
    ),
  },
  {
    accessorKey: 'product',
    header: 'Product',
    cell: ({ row }) => {
      // Try to get CarrierProductCode and CarrierCode from policy_details
      const transactionWithDetails = row.original as Transaction & { policy_details?: string };
      if (transactionWithDetails.policy_details) {
        try {
          const policyDetails = typeof transactionWithDetails.policy_details === 'string' 
            ? JSON.parse(transactionWithDetails.policy_details) 
            : transactionWithDetails.policy_details;
          
          return (
            <div>
              <p className="font-medium">
                {policyDetails?.CarrierProductCode || policyDetails?.ProductCode || 'TRAVEL'}
              </p>
              <p className="text-sm text-muted-foreground">
                {policyDetails?.CarrierCode || 'MALAYAN'}
              </p>
            </div>
          );
        } catch (e) {
          console.log('Failed to parse policy_details for product:', e);
        }
      }
      
      // Fallback
      return (
        <div>
          <p className="font-medium">TRAVEL</p>
          <p className="text-sm text-muted-foreground">MALAYAN</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'plan_code',
    header: 'Plan Code',
    cell: ({ row }) => {
      // Try to get PlanCode from policy_details
      const transactionWithDetails = row.original as Transaction & { policy_details?: string };
      if (transactionWithDetails.policy_details) {
        try {
          const policyDetails = typeof transactionWithDetails.policy_details === 'string' 
            ? JSON.parse(transactionWithDetails.policy_details) 
            : transactionWithDetails.policy_details;
          
          if (policyDetails?.PlanCode) {
            return <p className="font-medium">{policyDetails.PlanCode}</p>;
          }
        } catch (e) {
          console.log('Failed to parse policy_details for PlanCode:', e);
        }
      }
      
      // Fallback
      return <p className="font-medium">TMPHPC2</p>;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Premium',
    cell: ({ row }) => (
      <p className="font-semibold">
        {row.original.amount
          ? `₱${row.original.amount.toLocaleString()}`
          : 'N/A'}
      </p>
    ),
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
    accessorKey: 'created_at',
    header: 'Created Date',
    cell: ({ row }) => (
      <p className="text-sm">
        {row.original.created_at
          ? new Date(row.original.created_at).toLocaleString('en-US', {
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
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()

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

  const handleDateFilter = (fromDate: Date, toDate: Date) => {
    // Implement date filtering logic here
    console.log('Date filter:', fromDate, toDate)
    // For now, just show a toast
    toast.success(`Filtering from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`)
  }

  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    setSearchedTransactions(null)
    toast.success('Filters cleared')
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setCurrentPageSize(pageSize)

    try {
      sessionStorage.setItem('transactions.currentPage', String(page))
    } catch (e) {}
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
        customAction={
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
            {/* From Date */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">From:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">To:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter Buttons */}
            <Button
              onClick={() => fromDate && toDate && handleDateFilter(fromDate, toDate)}
              disabled={!fromDate || !toDate}
              size="sm"
            >
              Apply Filter
            </Button>
            
            {(fromDate || toDate || searchedTransactions) && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {/* Filter Results Info */}
            {(searchedTransactions || fromDate || toDate) && displayData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                Found {displayData?.data?.data?.length || 0} transactions
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}

export default MySalesPage
