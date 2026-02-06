'use client'

import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetCompletedTransactions } from '@/app/data/queries/transactions'
import { Transaction } from '@/types/agent/transactions'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const policyColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'policy_number',
    header: 'Policy No.',
    cell: ({ row }) => {
      const policyNumber = row.original.policy_number
      return (
        <p className="font-medium">
          {policyNumber && policyNumber.trim() !== '' ? policyNumber : 'N/A'}
        </p>
      )
    },
  },
  {
    accessorKey: 'certificate_no',
    header: 'Certificate No.',
    cell: () => {
      return <p className="font-medium">N/A</p>
    },
  },
  {
    accessorKey: 'policy_holder',
    header: 'Policy Holder',
    cell: ({ row }) => {
      const policyHolder = row.original.policy_holder
      return (
        <p className="font-medium uppercase">
          {policyHolder && policyHolder.trim() !== '' ? policyHolder : 'N/A'}
        </p>
      )
    },
  },
  {
    accessorKey: 'merchant_transaction_id',
    header: 'Payment ID',
    cell: ({ row }) => {
      const paymentId = row.original.merchant_transaction_id
      const status = row.original.status
      
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
      const productName = row.original.product?.name
      return (
        <p className="font-medium">
          {productName && productName.trim() !== '' ? productName : 'N/A'}
        </p>
      )
    },
  },
  {
    accessorKey: 'plan_name',
    header: 'Plan',
    cell: ({ row }) => {
      const planName = row.original.plan_name
      return (
        <p className="font-medium">
          {planName && planName.trim() !== '' ? planName : 'N/A'}
        </p>
      )
    },
  },
  {
    accessorKey: 'amount',
    header: 'Premium',
    cell: ({ row }) => {
      const amount = row.original.amount
      
      if (!amount || amount === 0) {
        return <p className="font-semibold">N/A</p>
      }
      
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
      if (isNaN(numericAmount)) {
        return <p className="font-semibold">N/A</p>
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

export default function PoliciesPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(10)
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()

  const {
    data: transactionsResponse,
    isLoading,
  } = useGetCompletedTransactions(currentPage, currentPageSize)

  const handleDateFilter = (fromDate: Date, toDate: Date) => {
    console.log('Date filter:', fromDate, toDate)
    toast.success(`Filtering from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`)
  }

  const handleClearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
    toast.success('Filters cleared')
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page)
    setCurrentPageSize(pageSize)

    try {
      sessionStorage.setItem('policies.currentPage', String(page))
    } catch (e) {}
  }

  return (
    <div className="relative mx-auto w-full space-y-6">
      <DataTable
        header="Policy Management"
        description="View and manage all your completed insurance policies, certificates, and coverage details."
        data={transactionsResponse?.data?.data ?? []}
        columns={policyColumns}
        renderMode="table"
        searchKey={['policy_number', 'policy_holder', 'merchant_transaction_id']}
        searchPlaceholder="policy number, policy holder, or payment ID"
        isLoading={isLoading}
        alternateColors
        pagination={
          transactionsResponse?.data
            ? {
                enabled: true,
                paginatedResponse: transactionsResponse.data,
                onPaginationChange: handlePaginationChange,
              }
            : { enabled: false }
        }
        actions={[
          {
            label: 'View Details',
            onClick: (row) => router.push(`/policies/${row.id}`),
          },
        ]}
        customAction={
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
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

            <Button
              onClick={() => fromDate && toDate && handleDateFilter(fromDate, toDate)}
              disabled={!fromDate || !toDate}
              size="sm"
            >
              Apply Filter
            </Button>
            
            {(fromDate || toDate) && (
              <Button
                onClick={handleClearFilters}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {(fromDate || toDate) && transactionsResponse && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                Found {transactionsResponse?.data?.data?.length || 0} policies
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}