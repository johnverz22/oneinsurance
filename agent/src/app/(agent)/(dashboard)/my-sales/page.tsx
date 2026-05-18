'use client'

import { toast } from 'sonner'
import React, { useState, useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGetTransactions } from '@/app/data/queries/transactions'
import { useSearchTransactions } from '@/app/data/mutations/agent/transactions'
import { TransactionsResponse, Transaction } from '@/types/agent/transactions'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'
import { Calendar, X, Filter, Download, ChevronDown, DollarSign, ShoppingCart, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { Label } from '@/components/ui/label'
import { useGetAgentStatistics } from '@/app/data/queries/statistics'

// ─── Stat Card ────────────────────────────────────────────────────────────────
const STAT_COLORS = [
  { bar: 'bg-primary', icon: 'text-primary bg-primary/10' },
  { bar: 'bg-blue-500', icon: 'text-blue-600 bg-blue-50' },
  { bar: 'bg-amber-500', icon: 'text-amber-600 bg-amber-50' },
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

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const lowerStatus = status?.toLowerCase() || 'unknown'
  const config: Record<string, { className: string; dotClass: string }> = {
    completed: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotClass: 'bg-emerald-500' },
    pending:   { className: 'bg-amber-50 text-amber-700 border-amber-200',       dotClass: 'bg-amber-500' },
    failed:    { className: 'bg-red-50 text-red-700 border-red-200',             dotClass: 'bg-red-500' },
    cancelled: { className: 'bg-red-50 text-red-700 border-red-200',             dotClass: 'bg-red-500' },
    refunded:  { className: 'bg-blue-50 text-blue-700 border-blue-200',          dotClass: 'bg-blue-500' },
  }
  const cfg = config[lowerStatus] ?? { className: 'bg-gray-100 text-gray-600 border-gray-200', dotClass: 'bg-gray-400' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dotClass)} />
      {status?.toUpperCase() || 'UNKNOWN'}
    </span>
  )
}

const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'policy_no',
    header: 'Policy No.',
    cell: ({ row }) => {
      const policyNo = row.original.policy_number
      if (policyNo && policyNo.trim() !== '') {
        return (
          <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-semibold border border-primary/20">
            {policyNo}
          </span>
        )
      }
      return <span className="text-muted-foreground text-sm">N/A</span>
    },
  },
  {
    accessorKey: 'certificate_no',
    header: 'Certificate No.',
    cell: () => <span className="text-muted-foreground text-sm">N/A</span>,
  },
  {
    accessorKey: 'merchant_transaction_id',
    header: 'Payment ID',
    cell: ({ row }) => {
      const paymentId = row.original.merchant_transaction_id
      const status = row.original.status || row.original.transaction_status
      return (
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground truncate max-w-[180px]" title={paymentId || ''}>
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
      const name = row.original.product?.name
      return (
        <span className="font-medium text-sm">{name && name.trim() !== '' ? name : 'N/A'}</span>
      )
    },
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => {
      const plan = row.original.plan_name
      return (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={plan || ''}>
          {plan && plan.trim() !== '' ? plan : 'N/A'}
        </span>
      )
    },
  },
  {
    accessorKey: 'amount',
    header: 'Premium',
    cell: ({ row }) => {
      const amount = row.original.amount
      if (!amount || amount === 0) return <span className="font-mono text-sm text-muted-foreground">0.00</span>
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
      if (isNaN(numericAmount)) return <span className="font-mono text-sm text-muted-foreground">0.00</span>
      return (
        <span className="font-mono text-sm font-semibold">
          {numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
  },
  {
    accessorKey: 'net_commission',
    header: 'Net Commission',
    cell: ({ row }) => {
      const agentCommission = row.original.commission_log?.agent_commission
      if (!agentCommission) return <span className="font-mono text-sm text-muted-foreground">0.00</span>
      const value = parseFloat(agentCommission)
      if (isNaN(value)) return <span className="font-mono text-sm text-muted-foreground">0.00</span>
      return (
        <span className="font-mono text-sm font-bold text-primary">
          {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created Date',
    cell: ({ row }) => {
      const createdAt = row.original.created_at
      if (!createdAt) return <span className="text-sm text-muted-foreground">—</span>
      try {
        const date = new Date(createdAt)
        if (isNaN(date.getTime())) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{format(date, 'MMM dd, yyyy')}</p>
            <p className="text-xs text-muted-foreground">{format(date, 'hh:mm a')}</p>
          </div>
        )
      } catch {
        return <span className="text-sm text-muted-foreground">—</span>
      }
    },
  },
]

const QUICK_FILTERS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year',    label: 'This Year' },
  { id: 'all',     label: 'All Time' },
]

const MySalesPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(10)
  const [fromDate, setFromDate] = useState<Date | undefined>()
  const [toDate, setToDate] = useState<Date | undefined>()
  const [appliedDateFrom, setAppliedDateFrom] = useState<string | undefined>()
  const [appliedDateTo, setAppliedDateTo] = useState<string | undefined>()
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const { data: transactionsResponse, isLoading } = useGetTransactions(currentPage, currentPageSize, appliedDateFrom, appliedDateTo)
  const { mutateAsync: searchTransactions, isPending: isSearching } = useSearchTransactions()
  const [searchedTransactions, setSearchedTransactions] = useState<TransactionsResponse | null>(null)
  const { data: statistics, isSuccess: isStatsFetched } = useGetAgentStatistics()

  const displayData = useMemo(() => {
    const base = searchedTransactions || transactionsResponse
    // Client-side date filtering since backend may not support date params
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
      data: {
        ...base.data,
        data: filtered,
        total: filtered.length,
        from: filtered.length > 0 ? 1 : 0,
        to: filtered.length,
      },
    }
  }, [searchedTransactions, transactionsResponse, appliedDateFrom, appliedDateTo])

  const fmt = (v: number) => v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) { setSearchedTransactions(null); return }
    try {
      const result = await searchTransactions({ keyword })
      setSearchedTransactions(result)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error searching transactions')
    }
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
    setActiveQuickFilter(null); setSearchedTransactions(null)
    setCurrentPage(1)
    toast.success('Filters cleared')
  }

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
    setFromDate(from); setToDate(to); setActiveQuickFilter(preset); setCurrentPage(1)
    // Apply immediately for quick filters
    setAppliedDateFrom(from ? format(from, 'yyyy-MM-dd') : undefined)
    setAppliedDateTo(to ? format(to, 'yyyy-MM-dd') : undefined)
    if (preset !== 'all') toast.success(`Showing transactions from ${preset}`)
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setCurrentPage(page); setCurrentPageSize(pageSize)
    try { sessionStorage.setItem('transactions.currentPage', String(page)) } catch {}
  }

  const handleExportCSV = () => {
    const data = displayData?.data?.data || []
    if (data.length === 0) { toast.error('No data to export'); return }
    const headers = ['Policy No.', 'Payment ID', 'Product', 'Plan', 'Premium', 'Net Commission', 'Status', 'Date']
    const rows = data.map((t: Transaction) => [
      t.policy_number || 'N/A', t.merchant_transaction_id || 'N/A',
      t.product?.name || 'N/A', t.plan_name || 'N/A', t.amount || '0',
      t.commission_log?.agent_commission || '0', t.status || 'N/A',
      t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm') : 'N/A',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('CSV exported successfully'); setShowExportMenu(false)
  }

  const hasActiveFilters = fromDate || toDate || searchedTransactions

  return (
    <div className="relative mx-auto w-full space-y-6">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isStatsFetched && statistics ? (
          <>
            <StatCard title="Total Sales" value={`PHP ${fmt(statistics.total_sales)}`} subtitle="Lifetime revenue" icon={DollarSign} colorIdx={0} />
            <StatCard title="Cases" value={String(statistics.number_of_sales)} subtitle="Total transactions" icon={ShoppingCart} colorIdx={1} />
            <StatCard title="Gross Commissions" value={`PHP ${fmt(statistics.gross_commissions)}`} subtitle="Before deductions" icon={TrendingUp} colorIdx={2} />
            <StatCard title="Net Commissions" value={`PHP ${fmt(statistics.net_commissions)}`} subtitle={`${statistics.gross_commissions > 0 ? ((statistics.net_commissions / statistics.gross_commissions) * 100).toFixed(1) : '0'}% of gross`} icon={Wallet} colorIdx={3} />
          </>
        ) : (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        )}
      </div>

      {/* ── Transaction Table ── */}
      <DataTable
        header="Transaction History"
        description={`${displayData?.data?.data?.length ?? 0} transactions found`}
        data={displayData?.data?.data ?? []}
        columns={transactionColumns}
        renderMode="table"
        searchKey={['proposal_number', 'policy_id', 'customer_id', 'policy_number', 'merchant_transaction_id']}
        searchPlaceholder="Search by policy number, payment ID..."
        isLoading={isLoading || isSearching}
        alternateColors
        pagination={
          displayData?.data
            ? { enabled: true, paginatedResponse: displayData.data, onPaginationChange: handlePaginationChange, onSearchChange: handleSearch }
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

            {/* Date range + export */}
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
              {hasActiveFilters && fromDate && toDate && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Calendar className="w-3 h-3" />
                  {format(fromDate, 'MMM dd')} – {format(toDate, 'MMM dd, yyyy')}
                </Badge>
              )}
              <div className="ml-auto relative">
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setShowExportMenu(!showExportMenu)}>
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border shadow-lg z-50 overflow-hidden">
                    <button onClick={handleExportCSV} className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                      <span>📄</span> Export CSV
                    </button>
                    <button onClick={() => { toast.info('Excel export coming soon'); setShowExportMenu(false) }} className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center gap-2">
                      <span>📊</span> Export Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}

export default MySalesPage
