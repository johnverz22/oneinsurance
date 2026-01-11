'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Eye, Download, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { ProcessPaymentDialog } from '@/components/transactions/process-payment-dialog'
import {
  PaymentDataTable,
  PaymentDataTableAction,
  createSortableHeader,
} from '@/components/transactions/payment-data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { useSearchTransaction } from '@/app/data/mutations/transactions'
import {
  useGetPayouts,
  useExportPayoutsCsv,
  useGetPayoutFilterByStatus,
} from '@/app/data/queries/payout'
import { Transaction } from '@/types/transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import PaymentSummary from '@/components/transactions/payment-summary'
import { exportToCSV } from '@/utils/export-to-csv'
import { PayoutDataTable } from '@/components/transactions/payout-data-table'
import { Payout } from '@/types/payout'

export default function TransactionsPage() {
  const [page, setPage] = useState<number>(1)
  const {
    data: transactionsData,
    isFetching,
    isLoading,
  } = useGetTransactions(page)

  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  // Convert Date objects to strings for API
  const dateFromStr = dateFrom
    ? dateFrom.toISOString().split('T')[0]
    : undefined
  const dateToStr = dateTo ? dateTo.toISOString().split('T')[0] : undefined

  // Export CSV states
  const [shouldExport, setShouldExport] = useState(false)
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')

  const { data: csvData, isFetching: isExporting } = useExportPayoutsCsv(
    exportDateFrom,
    exportDateTo
  )

  const { isAuthenticated } = useAuthStore()
  const [authChecking, setAuthChecking] = useState(true)
  const [searchKey, setSearchKey] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [isProcessPaymentOpen, setIsProcessPaymentOpen] = useState(false)
  const searchMutation = useSearchTransaction()

  // Get filtered payouts by status
  const hasStatusFilter = selectedStatus !== ''
  const statusFilterValue = hasStatusFilter
    ? (selectedStatus as 'pending' | 'completed')
    : undefined

  // Fetch payouts without status filter
  const {
    data: payoutsData,
    isFetching: isFetchingPayouts,
    isLoading: isLoadingPayouts,
  } = useGetPayouts(dateFromStr, dateToStr, !hasStatusFilter)

  // Fetch payouts with status filter
  const {
    data: filteredPayoutsData,
    isFetching: isFetchingFilteredPayouts,
    isLoading: isLoadingFilteredPayouts,
  } = useGetPayoutFilterByStatus(statusFilterValue!)

  useEffect(() => {
    // Small delay to let zustand persist/hydrate and avoid redirect flicker
    const t = setTimeout(() => {
      setAuthChecking(false)
      if (!isAuthenticated) {
        window.location.href = '/login'
      }
    }, 250)

    return () => clearTimeout(t)
  }, [isAuthenticated])

  // Handle CSV download when data is ready
  useEffect(() => {
    if (csvData && shouldExport) {
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      a.download = `payouts-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setShouldExport(false)
      setExportDateFrom('')
      setExportDateTo('')
      toast.success('Payouts exported successfully')
    }
  }, [csvData, shouldExport])

  const columns = React.useMemo<ColumnDef<Transaction, any>[]>(
    () => [
      {
        accessorKey: 'proposal_number',
        header: ({ column }) =>
          createSortableHeader('Proposal Number', column, 'font-bold'),
      },
      {
        accessorKey: 'policy_id',
        header: ({ column }) =>
          createSortableHeader('Policy ID', column, 'font-bold'),
      },
      {
        accessorKey: 'merchant_transaction_id',
        header: 'Merchant Transaction ID',
        cell: ({ row }) => row.original.merchant_transaction_id ?? '-',
      },
      {
        accessorKey: 'amount',
        header: ({ column }) =>
          createSortableHeader('Amount', column, 'font-bold'),
        cell: ({ row }) => {
          const amount = row.original.amount
          if (amount === null) return '-'
          return typeof amount === 'string'
            ? `₱ ${parseFloat(amount).toFixed(2)}`
            : `₱${amount.toFixed(2)}`
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) =>
          createSortableHeader('Status', column, 'font-bold'),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              row.original.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : row.original.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : row.original.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.status.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'transaction_date',
        header: ({ column }) =>
          createSortableHeader('Transaction Date', column, 'font-bold'),
        cell: ({ row }) => {
          const date = row.original.transaction_date
          return date ? new Date(date).toLocaleString() : '-'
        },
      },
      // actions column will be injected by DataTable via the actions prop
    ],
    []
  )

  const actions: PaymentDataTableAction<Transaction>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (tx: Transaction) => handleViewDetails(tx),
    },
  ]

  function handleSearchButtonClick(): void {
    if (searchKey.trim() === '') {
      toast.info('Please enter a search term.')
      return
    }
    searchMutation.mutate(searchKey.trim())
    setIsSearchMode(true)
  }

  function handleClearSearch(): void {
    setSearchKey('')
    setIsSearchMode(false)
    searchMutation.reset()
  }

  function handleExportToCSV(): void {
    // Check if both dates are selected
    if (!dateFrom || !dateTo) {
      toast.error('Please select both Date From and Date To to export')
      return
    }

    // Use the selected date range from the date pickers
    const dateFromStr = dateFrom.toISOString().split('T')[0]
    const dateToStr = dateTo.toISOString().split('T')[0]

    setExportDateFrom(dateFromStr)
    setExportDateTo(dateToStr)
    setShouldExport(true)
  }

  // Details dialog state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null)

  function handleViewDetails(transaction: Transaction) {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }

  // Determine which data to display
  const displayData = isSearchMode ? searchMutation.data : transactionsData
  const isDataLoading = isSearchMode
    ? searchMutation.isPending
    : isFetching || isLoading

  // Determine which payout data to display based on filters
  const displayPayoutData = hasStatusFilter
    ? filteredPayoutsData?.data?.data || []
    : payoutsData?.payouts || []
  const isPayoutDataLoading = hasStatusFilter
    ? isFetchingFilteredPayouts || isLoadingFilteredPayouts
    : isFetchingPayouts || isLoadingPayouts

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">
          Track commission payments, status, and transaction details
        </p>
      </div>

      <PaymentSummary
        totalPayments={5}
        totalAmount={289250}
        paid={109_000}
        pending={172_000}
        failed={7_750}
        avgProcessing={3.2}
      />

      <div>
        {authChecking ? (
          <div className="w-full space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-background flex items-center gap-4 rounded-md border p-3"
              >
                <div className="h-10 w-10">
                  <Skeleton className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="w-24">
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between">
              <div className="flex flex-1 items-end gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search by proposal number, policy ID, transaction ID..."
                    className="max-w-md rounded-full"
                  />
                  <Button className="from-primary to-lilac rounded-full bg-gradient-to-r text-white">
                    Search
                  </Button>
                </div>
                <div>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-[180px] rounded-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="dateFrom"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Date From
                  </Label>
                  <DateTimePicker
                    variant="date"
                    mode="single"
                    value={dateFrom}
                    onChange={(date) => setDateFrom(date)}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)

                      // Disable future dates
                      if (date > today) return true

                      // Disable dates after dateTo if dateTo is set
                      if (dateTo && date > dateTo) return true

                      return false
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label
                    htmlFor="dateTo"
                    className="text-muted-foreground text-xs font-medium"
                  >
                    Date To
                  </Label>
                  <DateTimePicker
                    variant="date"
                    mode="single"
                    value={dateTo}
                    onChange={(date) => setDateTo(date)}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(23, 59, 59, 999)

                      // Disable future dates
                      if (date > today) return true

                      // Disable dates before dateFrom if dateFrom is set
                      if (dateFrom && date < dateFrom) return true

                      return false
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="from-primary to-lilac rounded-full bg-gradient-to-r text-white"
                  onClick={() => setIsProcessPaymentOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Process Payment
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleExportToCSV}
                  disabled={isExporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export to CSV'}
                </Button>
              </div>
            </div>

            <PayoutDataTable
              data={displayPayoutData}
              isLoading={isPayoutDataLoading}
              onViewDetails={(payout) => {
                console.log('View details:', payout)
              }}
            />

            <ProcessPaymentDialog
              open={isProcessPaymentOpen}
              onOpenChange={setIsProcessPaymentOpen}
            />
          </>
        )}
      </div>
    </div>
  )
}
