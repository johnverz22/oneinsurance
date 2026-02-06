'use client'

import { toast } from 'sonner'
import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { useSearchTransactions } from '@/app/data/mutations/agent/transactions'
import { TransactionsResponse, Transaction } from '@/types/agent/transactions'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { 
  getProductName, 
} from '@/utils/product-mappings'

const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'policy_no',
    header: 'Policy No.',
    cell: ({ row }) => {
      const transaction = row.original;
      
      // Use the new policy_number field from root of payload (Carrier Policy Number)
      if (transaction.policy_number && transaction.policy_number.trim() !== '') {
        return <p className="font-medium">{transaction.policy_number}</p>;
      }
      
      // If no policy_number available, show N/A
      return <p className="font-medium">N/A</p>;
    },
  },
  {
    accessorKey: 'certificate_no',
    header: 'Certificate No.',
    cell: ({ row }) => {
      // Certificate No. not available in current backend response
      return <p className="font-medium">N/A</p>;
    },
  },
  {
    accessorKey: 'merchant_transaction_id',
    header: 'Payment ID',
    cell: ({ row }) => {
      const paymentId = row.original.merchant_transaction_id
      const status = row.original.status || row.original.transaction_status
      
      // Color mapping for payment statuses
      const getStatusColor = (status: string) => {
        const lowerStatus = status.toLowerCase()
        switch (lowerStatus) {
          case 'completed':
            return { text: 'text-green-600', bg: 'bg-green-600' }
          case 'pending':
            return { text: 'text-yellow-600', bg: 'bg-yellow-600' }
          case 'failed':
          case 'cancelled':
            return { text: 'text-red-600', bg: 'bg-red-600' }
          default:
            return { text: 'text-gray-600', bg: 'bg-gray-600' }
        }
      }

      return (
        <div>
          <p className="text-muted-foreground">
            {paymentId && paymentId.trim() !== '' ? paymentId : 'N/A'}
          </p>
          {status && (
            <div className="flex items-center gap-1 mt-1">
              <div className={cn('size-2 rounded-full', getStatusColor(status).bg)} />
              <span className={cn('text-xs font-medium', getStatusColor(status).text)}>
                {status.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'product',
    header: 'Product',
    cell: ({ row }) => {
      const transaction = row.original;
      
      // Use product.name from nested product object
      if (transaction.product?.name && transaction.product.name.trim() !== '') {
        return <p className="font-medium">{transaction.product.name}</p>;
      }
      
      return <p className="font-medium">N/A</p>;
    },
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => {
      const transaction = row.original;
      
      // plan_name is null in backend response
      if (transaction.plan_name && transaction.plan_name.trim() !== '') {
        return <p className="font-medium">{transaction.plan_name}</p>;
      }
      
      return <p className="font-medium">N/A</p>;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Premium',
    cell: ({ row }) => {
      const amount = row.original.amount
      
      if (!amount || amount === 0) {
        return <p className="font-semibold">₱0.00</p>
      }
      
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
      if (isNaN(numericAmount)) {
        return <p className="font-semibold">₱0.00</p>
      }
      
      return (
        <p className="font-semibold">
          ₱{numericAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      )
    },
  },
  {
    accessorKey: 'net_commission',
    header: 'Net Commission',
    cell: ({ row }) => {
      // commission_log is null in backend response
      const agentCommission = row.original.commission_log?.agent_commission
      
      if (!agentCommission) {
        return <p className="font-semibold">₱0.00</p>
      }
      
      const value = parseFloat(agentCommission)
      if (isNaN(value)) {
        return <p className="font-semibold">₱0.00</p>
      }
      
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
    accessorKey: 'created_at',
    header: 'Created Date',
    cell: ({ row }) => {
      const createdAt = row.original.created_at
      
      if (!createdAt) {
        return <p className="text-sm">N/A</p>
      }
      
      try {
        const date = new Date(createdAt)
        if (isNaN(date.getTime())) {
          return <p className="text-sm">N/A</p>
        }
        
        return (
          <p className="text-sm">
            {date.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )
      } catch (error) {
        return <p className="text-sm">N/A</p>
      }
    },
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
        searchPlaceholder="policy number or customer ID"
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
