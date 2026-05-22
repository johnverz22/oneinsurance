'use client'

import React, { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetCompletedTransactions, useGetAllCompletedTransactions } from '@/app/data/queries/transactions'
import { Transaction } from '@/types/agent/transactions'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { Calendar, X, Filter, FileText, DollarSign, CheckCircle, Layers, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Design System ────────────────────────────────────────────────────────────
import { StatCard, StatCardSkeleton, StatCardsGrid } from '@/components/ui/design-system'
import { StatusBadge } from '@/components/ui/design-system'
import { PolicyBadge, GoldActionLink } from '@/components/ui/design-system'

// ─── Quick Filters ────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year',    label: 'This Year' },
  { id: 'all',     label: 'All Time' },
]

// ─── Policy Columns ───────────────────────────────────────────────────────────
const policyColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'policy_number',
    header: 'Policy No.',
    cell: ({ row }) => (
      <PolicyBadge value={row.original.policy_number} />
    ),
  },
  {
    accessorKey: 'certificate_no',
    header: 'Certificate No.',
    cell: () => <p className="font-medium">N/A</p>,
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
      const lowerStatus = status?.toLowerCase() || ''
      const statusConfig: Record<string, { className: string; dotClass: string }> = {
        completed: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500' },
        pending:   { className: 'bg-amber-50 text-amber-700 border-amber-200',       dotClass: 'bg-amber-500' },
        failed:    { className: 'bg-red-50 text-red-700 border-red-200',             dotClass: 'bg-red-500' },
        cancelled: { className: 'bg-red-50 text-red-700 border-red-200',             dotClass: 'bg-red-500' },
      }
      const cfg = statusConfig[lowerStatus] ?? { className: 'bg-gray-100 text-gray-600 border-gray-200', dotClass: 'bg-gray-400' }
      return (
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
            {paymentId && paymentId.trim() !== '' ? paymentId : 'N/A'}
          </p>
          {status && <StatusBadge status={status} />}
        </div>
      )
    },
  },
  {
    accessorKey: 'product',
    header: 'Product',
    cell: ({ row }) => {
      const productName = row.original.product?.name
      return <p className="font-medium">{productName && productName.trim() !== '' ? productName : 'N/A'}</p>
    },
  },
  {
    accessorKey: 'plan_name',
    header: 'Plan',
    cell: ({ row }) => {
      const planName = row.original.plan_name
      return <p className="font-medium">{planName && planName.trim() !== '' ? planName : 'N/A'}</p>
    },
  },
  {
    accessorKey: 'amount',
    header: 'Premium',
    cell: ({ row }) => {
      const amount = row.original.amount
      if (!amount || amount === 0) return <p className="font-semibold">0.00</p>
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      if (isNaN(num)) return <p className="font-semibold">0.00</p>
      return (
        <p className="font-semibold">
          {num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created Date',
    cell: ({ row }) => {
      const createdAt = row.original.created_at
      if (!createdAt) return <p className="text-sm">N/A</p>
      try {
        const date = new Date(createdAt)
        if (isNaN(date.getTime())) return <p className="text-sm">N/A</p>
        return (
          <p className="text-sm">
            {date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )
      } catch { return <p className="text-sm">N/A</p> }
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const router = useRouter()
      return (
        <div className="text-right">
          <button
            onClick={() => router.push(`/policies/${row.original.id}`)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-[#B8960C] hover:bg-[#B8960C]/10 transition-colors"
            title="View Policy"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    },
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PoliciesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(10)
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [appliedDateFrom, setAppliedDateFrom] = useState<string | undefined>()
  const [appliedDateTo, setAppliedDateTo] = useState<string | undefined>()
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null)

  const { data: transactionsResponse, isLoading } = useGetCompletedTransactions(currentPage, currentPageSize)
  const { data: allTransactionsResponse, isLoading: isLoadingAll } = useGetAllCompletedTransactions()

  // Client-side date filtering
  const displayData = useMemo(() => {
    const base = transactionsResponse
    if (!appliedDateFrom && !appliedDateTo) return base
    if (!base?.data?.data) return base

    const from = appliedDateFrom ? new Date(appliedDateFrom + 'T00:00:00') : null
    const to = appliedDateTo ? new Date(appliedDateTo + 'T23:59:59') : null

    const filtered = base.data.data.filter((t: Transaction) => {
      if (!t.created_at) return false
      const txDate = new Date(t.created_at)
      if (from && txDate < from) return false
      if (to && txDate > to) return false
      return true
    })

    return {
      ...base,
      data: { ...base.data, data: filtered, total: filtered.length, from: filtered.length > 0 ? 1 : 0, to: filtered.length },
    }
  }, [transactionsResponse, appliedDateFrom, appliedDateTo])

  // Compute stat cards from ALL records (not just current page), with date filter applied
  const allPolicies = useMemo(() => {
    const all = allTransactionsResponse?.data?.data ?? []
    if (!appliedDateFrom && !appliedDateTo) return all
    const from = appliedDateFrom ? new Date(appliedDateFrom + 'T00:00:00') : null
    const to = appliedDateTo ? new Date(appliedDateTo + 'T23:59:59') : null
    return all.filter((t: Transaction) => {
      if (!t.created_at) return false
      const txDate = new Date(t.created_at)
      if (from && txDate < from) return false
      if (to && txDate > to) return false
      return true
    })
  }, [allTransactionsResponse, appliedDateFrom, appliedDateTo])

  const totalPolicies = allPolicies.length
  const totalPremium = allPolicies.reduce((sum: number, t: Transaction) => {
    const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount ?? 0)
    return sum + (isNaN(amt) ? 0 : amt)
  }, 0)
  const activePolicies = allPolicies.filter((t: Transaction) => t.status?.toLowerCase() === 'completed').length
  const uniqueProducts = new Set(allPolicies.map((t: Transaction) => t.product?.name).filter(Boolean)).size

  const fmt = (v: number) => v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleQuickDateFilter = (preset: string) => {
    const now = new Date()
    let from: Date | undefined, to: Date | undefined = now
    switch (preset) {
      case 'today':   from = now; to = now; break
      case 'week':    from = subDays(now, 7); break
      case 'month':   from = startOfMonth(now); to = endOfMonth(now); break
      case 'quarter': from = subDays(now, 90); break
      case 'year':    from = startOfYear(now); break
      case 'all':     from = undefined; to = undefined; break
    }
    setFromDate(from); setToDate(to); setActiveQuickFilter(preset)
    setAppliedDateFrom(from ? format(from, 'yyyy-MM-dd') : undefined)
    setAppliedDateTo(to ? format(to, 'yyyy-MM-dd') : undefined)
  }

  const handleDateFilter = () => {
    if (!fromDate || !toDate) { toast.error('Please select both From and To dates'); return }
    if (fromDate > toDate) { toast.error('From date cannot be after To date'); return }
    setAppliedDateFrom(format(fromDate, 'yyyy-MM-dd'))
    setAppliedDateTo(format(toDate, 'yyyy-MM-dd'))
    setCurrentPage(1)
    toast.success(`Filtering from ${format(fromDate, 'MMM dd, yyyy')} to ${format(toDate, 'MMM dd, yyyy')}`)
  }

  const handleClearFilters = () => {
    setFromDate(undefined); setToDate(undefined)
    setAppliedDateFrom(undefined); setAppliedDateTo(undefined)
    setActiveQuickFilter(null); setCurrentPage(1)
    toast.success('Filters cleared')
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page); setCurrentPageSize(pageSize)
    try { sessionStorage.setItem('policies.currentPage', String(page)) } catch {}
  }

  const hasActiveFilters = appliedDateFrom || appliedDateTo

  return (
    <div className="relative mx-auto w-full space-y-6">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl">
        {isLoading || isLoadingAll ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Policies" value={String(totalPolicies)} subtitle="In selected period" icon={FileText} colorIdx={0} />
            <StatCard title="Total Premium" value={`PHP ${fmt(totalPremium)}`} subtitle="Sum of all premiums" icon={DollarSign} colorIdx={1} />
            <StatCard title="Completed" value={String(activePolicies)} subtitle="Completed policies" icon={CheckCircle} colorIdx={2} />
            <StatCard title="Products" value={String(uniqueProducts)} subtitle="Unique products" icon={Layers} colorIdx={3} />
          </>
        )}
      </div>

      {/* ── Policy Table ── */}
      <DataTable
        header="Policy Management"
        description="View and manage all your completed insurance policies, certificates, and coverage details."
        data={displayData?.data?.data ?? []}
        columns={policyColumns}
        renderMode="table"
        searchPlaceholder="policy number, policy holder, or payment ID"
        isLoading={isLoading}
        alternateColors
        pagination={
          displayData?.data
            ? { enabled: true, paginatedResponse: displayData.data, onPaginationChange: handlePaginationChange }
            : { enabled: false }
        }
        customAction={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">From:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-[140px] justify-start text-left font-normal text-sm h-9', !fromDate && 'text-muted-foreground')}>
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={fromDate} onSelect={(d) => { setFromDate(d); setActiveQuickFilter(null) }} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">To:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-[140px] justify-start text-left font-normal text-sm h-9', !toDate && 'text-muted-foreground')}>
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    {toDate ? format(toDate, 'MMM dd, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={toDate} onSelect={(d) => { setToDate(d); setActiveQuickFilter(null) }} />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleDateFilter} disabled={!fromDate || !toDate} size="sm" className="h-9">
              Apply Filter
            </Button>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-destructive hover:bg-red-50">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        }
      />
    </div>
  )
}
