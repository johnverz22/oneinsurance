'use client'

import * as React from 'react'
import { useEffect, useState, useRef } from 'react'
import { Eye, Download, X, Plus, Upload, Settings } from 'lucide-react'
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
  useGetPayoutStatistics,
} from '@/app/data/queries/payout'
import {
  useGeneratePayout,
  useUploadPayoutCsv,
} from '@/app/data/mutations/payout'
import { Transaction } from '@/types/transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import PaymentSummary from '@/components/transactions/payment-summary'
import { exportToCSV } from '@/utils/export-to-csv'
import { PayoutDataTable } from '@/components/transactions/payout-data-table'
import {
  Payout,
  GeneratePayoutResponse,
  PayoutStatistics,
} from '@/types/payout'
import Link from 'next/link'

export default function TransactionsPage() {
  const [page, setPage] = useState<number>(1)
  const {
    data: transactionsData,
    isFetching,
    isLoading,
  } = useGetTransactions(page)

  // Set default dates: last year to today
  const getDefaultDateFrom = () => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return date
  }

  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    getDefaultDateFrom()
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())

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
  const [generatedPayouts, setGeneratedPayouts] = useState<Payout[] | null>(
    null
  )
  const searchMutation = useSearchTransaction()
  const generatePayoutMutation = useGeneratePayout()
  const uploadPayoutCsvMutation = useUploadPayoutCsv()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Fetch payout statistics
  const { data: payoutStatistics } = useGetPayoutStatistics(
    dateFromStr || '',
    dateToStr || ''
  )

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
          if (amount === null || amount === undefined) return '-'
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
            {row.original.status?.toUpperCase() || 'UNKNOWN'}
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

  async function handleGeneratePayout(): Promise<void> {
    // Check if both dates are selected
    if (!dateFrom || !dateTo) {
      toast.error('Please select both Date From and Date To to generate payout')
      return
    }

    const dateFromStr = dateFrom.toISOString().split('T')[0]
    const dateToStr = dateTo.toISOString().split('T')[0]

    try {
      const response = await generatePayoutMutation.mutateAsync({
        date_from: dateFromStr,
        date_to: dateToStr,
      })

      if (response?.message) {
        toast.success(response.message)
      } else {
        toast.success('Payout generated successfully')
      }

      // Store the generated payouts to display them
      if (response?.payouts) {
        setGeneratedPayouts(response.payouts)
      }
    } catch (error) {
      toast.error('Failed to generate payout')
    }
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

  function handleUploadCSVClick(): void {
    fileInputRef.current?.click()
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    // Validate CSV headers
    const expectedHeaders = [
      'Payout Reference',
      'Agent ID',
      'Agent Name',
      'Payout Amount',
      'Account Type',
      'Account Name',
      'Account Number',
      'Date From',
      'Date To',
      'Generated By',
      'Date Generated',
      'Status',
    ]

    try {
      // Read first line to check headers
      const text = await file.text()
      const firstLine = text.split('\n')[0].trim()
      const headers = firstLine
        .split(',')
        .map((h) => h.replace(/^"|"$/g, '').trim())

      // Compare headers
      const headersMatch = expectedHeaders.every(
        (expectedHeader, index) => headers[index] === expectedHeader
      )

      if (!headersMatch || headers.length !== expectedHeaders.length) {
        toast.error(
          `Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}`
        )
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      const response = await uploadPayoutCsvMutation.mutateAsync(file)
      toast.success(response?.message || 'CSV uploaded successfully')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error('Failed to upload CSV file')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
  const displayPayoutData = generatedPayouts
    ? generatedPayouts
    : hasStatusFilter
      ? filteredPayoutsData?.data?.data || []
      : payoutsData?.payouts || []
  const isPayoutDataLoading = hasStatusFilter
    ? isFetchingFilteredPayouts || isLoadingFilteredPayouts
    : isFetchingPayouts || isLoadingPayouts

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground">
            Track commission payments, status, and transaction details
          </p>
        </div>

        <Button asChild>
          <Link href="/payments/configurations">
            <Settings />
            Configurations
          </Link>
        </Button>
      </div>

      <PaymentSummary
        totalPayouts={payoutStatistics?.total_payouts || 0}
        totalAmount={payoutStatistics?.total_amount || 0}
        pendingCount={payoutStatistics?.pending_count || 0}
        completedCount={payoutStatistics?.completed_count || 0}
        pendingAmount={payoutStatistics?.pending_amount || 0}
        completedAmount={payoutStatistics?.completed_amount || 0}
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
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-[140px]">
                <DateTimePicker
                  variant="date"
                  mode="single"
                  value={dateFrom}
                  onChange={(date) => setDateFrom(date)}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(23, 59, 59, 999)
                    if (date > today) return true
                    if (dateTo && date > dateTo) return true
                    return false
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">to</span>
              <div className="w-[140px]">
                <DateTimePicker
                  variant="date"
                  mode="single"
                  value={dateTo}
                  onChange={(date) => setDateTo(date)}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(23, 59, 59, 999)
                    if (date > today) return true
                    if (dateFrom && date < dateFrom) return true
                    return false
                  }}
                />
              </div>
              <Button
                onClick={() => setIsProcessPaymentOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Process Payment
              </Button>
              <Button
                variant="outline"
                onClick={handleGeneratePayout}
                disabled={generatePayoutMutation.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                {generatePayoutMutation.isPending
                  ? 'Generating...'
                  : 'Generate Payout'}
              </Button>
              <Button
                variant="outline"
                onClick={handleUploadCSVClick}
                disabled={uploadPayoutCsvMutation.isPending}
              >
                <Upload className="mr-1 h-4 w-4" />
                {uploadPayoutCsvMutation.isPending
                  ? 'Uploading...'
                  : 'Upload Payout CSV'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleExportToCSV}
                disabled={isExporting}
              >
                <Download className="mr-1 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export to CSV'}
              </Button>
            </div>

            <PayoutDataTable
              data={displayPayoutData}
              isLoading={isPayoutDataLoading}
              onViewDetails={(payout) => {}}
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
