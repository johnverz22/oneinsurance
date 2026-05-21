'use client'

import React, { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetCompletedTransactions, useGetAllCompletedTransactions } from '@/app/data/queries/transactions'
import { Transaction } from '@/types/agent/transactions'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { Calendar, X, Filter, FileText, DollarSign, CheckCircle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ─── Stat Card (same style as My Sales) ──────────────────────────────────────
const STAT_COLORS = [
  { bar: 'bg-primary', icon: 'text-primary bg-primary/10' },
  { bar: 'bg-[#B8960C]', icon: 'text-[#B8960C] bg-[#B8960C]/10' },
  { bar: 'bg-emerald-500', icon: 'text-emerald-600 bg-emerald-50' },
  { bar: 'bg-violet-500', icon: 'text-violet-600 bg-violet-50' },
]

const StatCard = ({
  title, value, subtitle, icon: Icon, colorIdx,
}: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; colorIdx: number
}) => {
  const c = STAT_COLORS[colorIdx]
  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className={cn('h-1.5 w-full', c.bar)} />
      <CardContent className="p-4">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', c.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

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
    cell: ({ row }) => {
      const policyNumber = row.original.policy_number
      if (policyNumber && policyNumber.trim() !== '') {
        return (
          <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold border border-primary/20">
            {policyNumber}
          </span>
        )
      }
      return <p className="font-medium text-muted-foreground">N/A</p>
    },
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
          {status && (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.className)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
              {status.toUpperCase()}
            </span>
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
          <Button
            onClick={() => router.push(`/policies/${row.original.id}`)}
            variant="link"
            className="text-[#B8960C] hover:text-[#B8960C]/80"
          >
            View
          </Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || isLoadingAll ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
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
        searchKey={['policy_number', 'policy_holder', 'merchant_transaction_id']}
        searchPlaceholder="policy number, policy holder, or payment ID"
        isLoading={isLoading}
        alternateColors
        pagination={
          displayData?.data
            ? { enabled: true, paginatedResponse: displayData.data, onPaginationChange: handlePaginationChange }
            : { enabled: false }
        }
        customAction={
          <div className="space-y-3">
            {/* Quick filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-medium">Quick:</span>
              </div>
              {QUICK_FILTERS.map((f) => (
                <Button
                  key={f.id}
                  variant={activeQuickFilter === f.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickDateFilter(f.id)}
                  className={cn(
                    'h-7 text-xs rounded-full',
                    activeQuickFilter === f.id
                      ? 'from-primary to-lilac bg-gradient-to-r text-white border-transparent'
                      : 'border-gray-200 hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border shadow-sm">
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
              <Button onClick={handleDateFilter} disabled={!fromDate || !toDate} size="sm" className="h-9 from-primary to-lilac bg-gradient-to-r text-white">
                Apply Filter
              </Button>
              {hasActiveFilters && (
                <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-destructive hover:bg-red-50">
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        }
      />
    </div>
  )
}
