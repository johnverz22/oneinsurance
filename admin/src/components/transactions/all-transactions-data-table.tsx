'use client'

import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetAllTransactions } from '@/app/data/queries/transactions'
import { Calendar, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/design-system'
import { PolicyBadge, GoldActionLink } from '@/components/ui/design-system'
import { cn } from '@/lib/utils'

interface AllTransactionsDataTableProps {
  onPageChange: (page: number) => void
  currentPage: number
}

export function AllTransactionsDataTable({
  onPageChange,
  currentPage,
}: AllTransactionsDataTableProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [appliedFrom, setAppliedFrom] = useState<Date | undefined>()
  const [appliedTo, setAppliedTo] = useState<Date | undefined>()
  const router = useRouter()

  const { data: transactionsResponse, isLoading, error } = useGetAllTransactions(currentPage)

  const allTransactions = transactionsResponse?.data?.data || []

  // Client-side date filter
  const displayData = React.useMemo(() => {
    if (!appliedFrom && !appliedTo) return allTransactions
    return allTransactions.filter((t: any) => {
      const dateField = t.transaction_date || t.created_at
      if (!dateField) return false
      const d = new Date(dateField)
      if (appliedFrom && d < appliedFrom) return false
      if (appliedTo && d > appliedTo) return false
      return true
    })
  }, [allTransactions, appliedFrom, appliedTo])

  const handleViewPolicy = (agentId: number, transactionId: number, merchantTxId?: string) => {
    const url = merchantTxId
      ? `/agents/${agentId}/policies/${transactionId}?merchant_transaction_id=${merchantTxId}`
      : `/agents/${agentId}/policies/${transactionId}`
    router.push(url)
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'policy_number',
      header: 'Policy No',
      cell: ({ row }) => <PolicyBadge value={row.original.policy_number} />,
    },
    {
      accessorKey: 'certificate_number',
      header: 'Certificate No',
      cell: ({ row }) => <span className="text-sm">{row.original.certificate_number || 'N/A'}</span>,
    },
    {
      accessorKey: 'policy_holder',
      header: 'Policy Holder',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.policy_holder || row.original.customer_name || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => <span className="text-sm">{row.original.product_name || 'N/A'}</span>,
    },
    {
      accessorKey: 'plan_name',
      header: 'Plan',
      cell: ({ row }) => (
        <span className="text-sm max-w-[200px] truncate block">{row.original.plan_name || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'coverage_period',
      header: 'Coverage Period',
      cell: ({ row }) => {
        const t = row.original
        const policyDetails = typeof t.policy_details === 'string'
          ? (() => { try { return JSON.parse(t.policy_details) } catch { return null } })()
          : t.policy_details
        const effectiveDate = policyDetails?.EffectiveDate
          ? new Date(policyDetails.EffectiveDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : 'N/A'
        const expiryDate = policyDetails?.ExpiryDate
          ? new Date(policyDetails.ExpiryDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
          : 'N/A'
        const travelDays = policyDetails?.TravelDays || ''
        return (
          <div className="text-sm">
            <p>{effectiveDate} – {expiryDate}</p>
            {travelDays && <p className="text-xs text-muted-foreground">{travelDays} Days</p>}
          </div>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: 'Premium',
      cell: ({ row }) => (
        <span className="font-semibold text-right block">
          {row.original.amount ? Number(row.original.amount).toFixed(2) : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
      cell: ({ row }) => <span className="text-sm">{row.original.currency || 'N/A'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <GoldActionLink
          onClick={() => handleViewPolicy(
            row.original.agent_id,
            row.original.id,
            row.original.merchant_transaction_id
          )}
        >
          View
        </GoldActionLink>
      ),
    },
  ]

  const paginatedResponse = transactionsResponse?.data
    ? {
        current_page: transactionsResponse.data.current_page,
        data: displayData,
        first_page_url: '',
        from: transactionsResponse.data.from,
        last_page: transactionsResponse.data.last_page,
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        per_page: transactionsResponse.data.per_page,
        prev_page_url: null,
        to: transactionsResponse.data.to,
        total: transactionsResponse.data.total,
      }
    : null

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">From:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-sm">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">To:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-sm">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {toDate ? format(toDate, 'MMM dd, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          size="sm"
          className="h-9 from-primary to-accent bg-gradient-to-r text-white"
          disabled={!fromDate || !toDate}
          onClick={() => { setAppliedFrom(fromDate); setAppliedTo(toDate) }}
        >
          Apply Filter
        </Button>
        {(appliedFrom || appliedTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-destructive"
            onClick={() => { setFromDate(undefined); setToDate(undefined); setAppliedFrom(undefined); setAppliedTo(undefined) }}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        header="All Transactions"
        description="View and manage all policy transactions across all agents."
        columns={columns}
        data={displayData}
        renderMode="table"
        searchKey={['policy_number', 'policy_holder', 'product_name']}
        searchPlaceholder="policy number, policy holder, or product"
        isLoading={isLoading}
        alternateColors
        pagination={
          paginatedResponse
            ? {
                enabled: true,
                paginatedResponse,
                onPaginationChange: (page) => onPageChange(page),
              }
            : { enabled: false }
        }
      />
    </div>
  )
}
