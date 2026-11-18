'use client'

/**
 * sales-client.tsx — "Sales" page (mockup: /mockups/agent/sales)
 *
 * Matches the platform-shell mockup:
 *   - Three metric cards (portal-metric-value scale) on the canvas
 *   - "Transaction History" heading + live record count on the canvas
 *   - Single "Date range" field + search, applied live; Clear appears
 *     only while filters are active; icon-only export menu (PDF, CSV)
 *   - Table gets its own bordered surface (no enclosing page card):
 *     Policy no. · Certificate no. · Payment ID · Plan · Premium ·
 *     Status · Created at · Action
 *   - Net commission renders as "NC {amount}" under Premium + legend
 *   - Pagination: Showing X–Y of Z + Rows select + Previous / numbered
 *     pages / Next
 *
 * Filtering/pagination is handled server-side. The query re-fetches whenever
 * search, date range, page, or perPage change.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  X,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import type { Transaction, AgentStatistics, PaginationInfo, SalesListResponse } from '@/types/agent/sales'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a raw API product value to a title-cased display name. */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Product display name. The `product` key is a catalog object (null for
 * travel) and must not be displayed — use `product_name`, falling back to
 * `line_of_business`. Both can be null on older rows.
 */
function resolveProductName(tx: Transaction): string {
  const raw = tx.product_name || tx.line_of_business || ''
  return raw ? toTitleCase(raw) : '—'
}

/** Format a date ISO string into separate date + time strings. */
function formatDateDisplay(dateStr?: string | null): { date: string; time: string } {
  if (!dateStr) return { date: '—', time: '' }
  try {
    const dt = parseISO(dateStr)
    return {
      date: format(dt, 'MMM d, yyyy'),
      time: format(dt, 'h:mm a'),
    }
  } catch {
    const parts = dateStr.split('T')
    return { date: parts[0] || '—', time: '' }
  }
}

/**
 * Extract commission from a transaction; returns amount and whether it's pending.
 * `net_commission` is a top-level money string ("150.00") and is null until a
 * commission has been logged for the sale.
 */
function resolveCommission(tx: Transaction): { amount: number; isPending: boolean } {
  const raw = tx.net_commission ?? tx.commission_log?.net_commission ?? tx.commission_log?.agent_commission
  const amount = Number(raw ?? 0)
  const status = (tx.status ?? tx.transaction_status ?? '').toLowerCase()
  const isPending = raw == null || !['success', 'successful', 'completed', 'paid'].includes(status)
  return { amount, isPending }
}

function resolvePlanName(tx: Transaction, productName: string): string {
  const plan = tx.plan_name ?? ''
  const cleaned = typeof plan === 'string' ? plan.trim() : ''
  if (!cleaned || cleaned.toLowerCase() === productName.toLowerCase()) {
    return productName
  }
  return toTitleCase(cleaned)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** KPI card skeleton — mirrors the mockup's three-bar pulse */
function MetricSkeleton() {
  return (
    <div className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6" aria-hidden="true">
      <div className="space-y-3 motion-safe:animate-pulse">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-7 w-32 rounded" />
        <div className="skeleton h-3 w-28 rounded" />
      </div>
    </div>
  )
}

/** KPI card error state */
function MetricError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="agent-dashboard__panel min-w-0 border-border flex flex-col items-center gap-2 p-6 text-center">
      <AlertCircle className="size-5 text-[#dc2626]" aria-hidden="true" />
      <p className="text-sm text-[var(--text-muted)]">Failed to load</p>
      <button type="button" onClick={onRetry} className="btn-tertiary min-h-0 px-3 py-1.5 text-xs">
        Retry
      </button>
    </div>
  )
}

/** Table skeleton rows */
function TableSkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          {[180, 140, 110, 160, 90, 90, 110, 60].map((w, j) => (
            <td key={j} className="px-4 py-4">
              <div
                className="skeleton h-4 rounded"
                style={{ width: `${w * 0.6 + (i * j * 13) % (w * 0.4)}px`, maxWidth: '100%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Compact page-number window: 1 … c-1 c c+1 … last */
function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SalesClient() {
  // ── Filter state ──
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null)

  // ── Table state ──
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)

  // Debounce timer ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const authFetch = useAuthFetch()

  const hasActiveFilters = Boolean(appliedSearch || appliedRange)

  // ── Stats query ──
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery<AgentStatistics>({
    queryKey: ['agent-statistics'],
    queryFn: async () => {
      const res = await authFetch('/api/agent/statistics')
      if (!res.ok) throw new Error('Failed to load statistics')
      const json = await res.json()
      return json.data ?? json
    },
  })

  // ── Transactions query — server-side filtering + pagination ──
  //
  // Backend endpoint: GET /api/v1/agents/transactions (via BFF /api/transactions)
  // Params: page, per_page (default 10, max 100), search, date_from, date_to
  // (yyyy-MM-dd, filters on created_at, both inclusive).
  //
  // Response: { success, message, data: { current_page, last_page, per_page,
  //   total, data: [...rows...] } } — page info lives directly on `data`,
  //   there is no `meta` block.
  //
  const txQueryKey = ['transactions', { page, perPage, search: appliedSearch, range: appliedRange }] as const

  const {
    data: txData,
    isLoading: txLoading,
    isFetching: txFetching,
    isError: txError,
    error: txQueryError,
    refetch: refetchTx,
  } = useQuery<SalesListResponse>({
    queryKey: txQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(perPage))
      if (appliedSearch) params.set('search', appliedSearch)
      if (appliedRange?.from) params.set('date_from', appliedRange.from)
      if (appliedRange?.to) params.set('date_to', appliedRange.to)

      const res = await authFetch(`/api/transactions?${params.toString()}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        // Surface Laravel validation errors (422) so they can be shown on the filters
        const err = new Error('Failed to load transactions') as Error & {
          status?: number
          fieldErrors?: Record<string, string[]>
        }
        err.status = res.status
        err.fieldErrors = json?.errors
        throw err
      }
      return json as SalesListResponse
    },
    placeholderData: (prev) => prev, // keep previous data visible while refetching
    staleTime: 30_000,
  })

  // ── Normalise the backend response ──
  // Paginator shape: { data: { data: [...rows...], current_page, last_page,
  //   per_page, total, ... } }
  const { transactions, pagination } = useMemo(() => {
    const inner = txData?.data
    if (!inner) return { transactions: [] as Transaction[], pagination: null as PaginationInfo | null }

    const rows = Array.isArray(inner.data) ? inner.data : []
    const p: PaginationInfo = {
      current_page: inner.current_page ?? page,
      last_page: inner.last_page ?? 1,
      per_page: inner.per_page ?? perPage,
      total: inner.total ?? rows.length,
    }
    return { transactions: rows, pagination: p }
  }, [txData, page, perPage])

  // First 422 field error message (e.g. errors.date_from / errors.date_to)
  const filterError = useMemo(() => {
    const err = txQueryError as { status?: number; fieldErrors?: Record<string, string[]> } | null
    if (err?.status !== 422 || !err.fieldErrors) return null
    const first = Object.values(err.fieldErrors).flat()[0]
    return first ?? 'Check the date range and try again.'
  }, [txQueryError])

  // Server-reported totals
  const totalItems = pagination?.total ?? transactions.length
  const totalPages = pagination?.last_page ?? Math.max(1, Math.ceil(totalItems / perPage))
  const safePage = Math.min(page, totalPages)
  const fromItem = totalItems > 0 ? (safePage - 1) * perPage + 1 : 0
  const toItem = pagination
    ? Math.min(safePage * perPage, totalItems)
    : transactions.length > 0
      ? (safePage - 1) * perPage + transactions.length
      : 0

  // ── KPI values ──
  const totalSales = Number(stats?.total_sales ?? stats?.total_premium ?? 0)
  const totalCases = Number(stats?.number_of_sales ?? stats?.total_cases ?? 0)
  const netCommission = Number(stats?.net_commissions ?? 0)

  // ── Handlers ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setAppliedSearch(value.trim())
      setPage(1)
    }, 400)
  }, [])

  const handleRangeApply = useCallback((range: DateRange | null) => {
    setAppliedRange(range)
    setPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setAppliedSearch('')
    setAppliedRange(null)
    setPage(1)
  }, [])

  // ── Export — fetches all filtered rows from the server ──
  // The backend caps per_page at 100, so page through the results.
  const fetchAllForExport = useCallback(async (): Promise<Transaction[]> => {
    const PER_PAGE = 100
    const rows: Transaction[] = []
    let currentPage = 1
    let lastPage = 1

    do {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('per_page', String(PER_PAGE))
      if (appliedSearch) params.set('search', appliedSearch)
      if (appliedRange?.from) params.set('date_from', appliedRange.from)
      if (appliedRange?.to) params.set('date_to', appliedRange.to)

      const res = await authFetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error('Export fetch failed')
      const json = (await res.json()) as SalesListResponse
      const inner = json?.data
      const pageRows = Array.isArray(inner?.data) ? inner.data : []
      rows.push(...pageRows)
      lastPage = inner?.last_page ?? currentPage
      currentPage += 1
    } while (currentPage <= lastPage)

    return rows
  }, [authFetch, appliedSearch, appliedRange])

  const buildExportRows = useCallback((rows: Transaction[]) =>
    rows.map((tx) => {
      const productName = resolveProductName(tx)
      const { amount: comm, isPending } = resolveCommission(tx)
      const { date, time } = formatDateDisplay(tx.created_at)
      return {
        policy: tx.policy_number ?? 'N/A',
        certificate: tx.certificate_number ?? 'N/A',
        payment: tx.merchant_transaction_id ?? String(tx.id),
        plan: resolvePlanName(tx, productName),
        product: productName,
        premium: Number(tx.amount ?? 0),
        commission: comm,
        commissionPending: isPending,
        status: (tx.status ?? 'pending').toString(),
        created: time ? `${date} ${time}` : date,
      }
    }), [])

  const handleExportCSV = useCallback(async () => {
    try {
      const rows = await fetchAllForExport()
      if (!rows.length) { toast.error('No transactions to export.'); return }
      const headers = [
        'Policy No.', 'Certificate No.', 'Payment ID', 'Plan', 'Product',
        'Premium', 'Net Commission', 'Status', 'Created At',
      ]
      const csvRows = buildExportRows(rows).map((r) => [
        `"${r.policy}"`, `"${r.certificate}"`, `"${r.payment}"`,
        `"${r.plan}"`, `"${r.product}"`, `"${r.premium.toFixed(2)}"`,
        `"${r.commissionPending ? 'Pending' : r.commission.toFixed(2)}"`,
        `"${r.status}"`, `"${r.created}"`,
      ])
      const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sales-transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed. Please try again.')
    }
  }, [fetchAllForExport, buildExportRows])

  const handleExportPDF = useCallback(async () => {
    try {
      const rows = await fetchAllForExport()
      if (!rows.length) { toast.error('No transactions to export.'); return }
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFontSize(14)
      doc.text('Sales transactions', 14, 15)
      autoTable(doc, {
        startY: 20,
        head: [['Policy No.', 'Certificate No.', 'Payment ID', 'Plan', 'Product', 'Premium', 'Net Commission', 'Status', 'Created At']],
        body: buildExportRows(rows).map((r) => [
          r.policy, r.certificate, r.payment, r.plan, r.product,
          formatCurrency(r.premium),
          r.commissionPending ? 'Pending' : formatCurrency(r.commission),
          r.status, r.created,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 104, 56] },
      })
      doc.save(`sales-transactions-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch {
      toast.error('Export failed. Please try again.')
    }
  }, [fetchAllForExport, buildExportRows])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PortalContentHeader
        title="Sales"
        description="Review your sales and transaction history."
      />

      {/* ── Metric cards ── */}
      <section
        aria-label="Sales metrics"
        className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : statsError ? (
          Array.from({ length: 3 }).map((_, i) => (
            <MetricError key={i} onRetry={refetchStats} />
          ))
        ) : (
          <>
            <div className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6">
              <p className="text-base font-medium text-[var(--text-main)]">Total sales</p>
              <p className="portal-metric-value mt-4 font-semibold text-[var(--text-main)]">
                {formatCurrency(totalSales)}
              </p>
              <p className="mt-2 text-base text-[var(--text-sub)]">Lifetime revenue</p>
            </div>
            <div className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6">
              <p className="text-base font-medium text-[var(--text-main)]">Total cases</p>
              <p className="portal-metric-value mt-4 font-semibold text-[var(--text-main)]">
                {totalCases.toLocaleString()}
              </p>
              <p className="mt-2 text-base text-[var(--text-sub)]">Total transactions</p>
            </div>
            <div className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6">
              <p className="text-base font-medium text-[var(--text-main)]">Net commissions</p>
              <p className="portal-metric-value mt-4 font-semibold text-[var(--text-main)]">
                {formatCurrency(netCommission)}
              </p>
              <p className="mt-2 text-base text-[var(--text-sub)]">
                {totalSales > 0 ? `${Math.round((netCommission / totalSales) * 100)}% of gross` : '0% of gross'}
              </p>
            </div>
          </>
        )}
      </section>

      {/* ── Transaction History Skeleton ── */}
      {txLoading && (
        <section className="mt-5" role="status" aria-label="Loading transaction history">
          <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
            <div className="space-y-3">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-3 w-36" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="skeleton h-11 w-40" />
              <div className="skeleton h-11 w-40" />
              <div className="skeleton h-11 w-28" />
              <div className="skeleton h-11 w-28" />
            </div>
            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[970px] border-y border-[var(--border)] py-3 dark:border-[#3d4140]">
                <div className="skeleton h-3 w-full" />
              </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid min-w-[970px] grid-cols-9 gap-4 py-5"
                  >
                    {Array.from({ length: 9 }).map((_, j) => (
                      <div key={j} className="skeleton h-4" />
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Transaction History Table ── */}
      {!txLoading && (
        <section className="portal-table-layout mt-8" aria-labelledby="sales-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="sales-title"
                className="text-xl font-semibold tracking-tight text-[var(--text-main)]"
              >
                Transaction History
              </h2>
              <p
                aria-live="polite"
                aria-atomic="true"
                className="mt-1 text-sm text-[var(--text-sub)]"
              >
                {`${totalItems.toLocaleString()} transaction${totalItems !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          <div className="portal-table-filters mt-5">
            <form
              role="search"
              aria-label="Search and filter table"
              className="portal-table-filters__form"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="portal-table-filters__date">
                <DateRangeField
                  id="sales-range"
                  value={appliedRange}
                  onApply={handleRangeApply}
                />
              </div>

              <div className="portal-table-filters__search">
                <label htmlFor="sales-search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <input
                    id="sales-search"
                    type="search"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="ui-form-field w-full pl-10 pr-8 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[#006838]"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="min-h-11 rounded-md px-3 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:bg-[#303232]"
                >
                  Clear
                </button>
              )}

              <div className="portal-table-filters__actions">
                <ExportMenu
                  label="Download table"
                  items={[
                    { id: 'pdf', label: 'PDF', onSelect: handleExportPDF },
                    { id: 'csv', label: 'CSV', onSelect: handleExportCSV },
                  ]}
                />
              </div>
            </form>
          </div>

          {filterError && (
            <p role="alert" className="mt-3 text-sm text-[#dc2626]">
              {filterError}
            </p>
          )}

          {/* ── Table surface ── */}
          {txError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <AlertCircle className="size-8 text-[#dc2626]" aria-hidden="true" />
              <p className="text-base font-medium text-[var(--text-main)]">
                Failed to load transactions
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetchTx()}
                className="btn-secondary mt-1 px-4"
              >
                <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'mt-5 overflow-x-auto rounded-lg border border-[var(--border)] dark:border-[#3d4140] transition-opacity',
                  txFetching && !txLoading && 'opacity-60'
                )}
              >
                <table className="portal-data-table w-full min-w-[970px] text-left text-base">
                  <caption className="sr-only">
                    Agent sales transactions
                  </caption>
                  <thead className="bg-[var(--portal-canvas)] text-sm font-semibold text-[var(--text-main)] dark:bg-[#303232] dark:text-[#f4f5f2]">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Policy no.
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Certificate no.
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Payment ID
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Plan
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Premium
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Created at
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] bg-white dark:divide-[#3d4140] dark:bg-[var(--card)]">
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-sm text-[var(--text-sub)]"
                        >
                          No cases found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => {
                        const policyNo = tx.policy_number ?? 'N/A'
                        const certNo = tx.certificate_number ?? 'N/A'
                        const paymentRef =
                          tx.merchant_transaction_id ??
                          String(tx.id)
                        const productName = resolveProductName(tx)
                        const planName = resolvePlanName(tx, productName)
                        const premium = Number(tx.amount ?? 0)
                        const { amount: comm, isPending: commPending } =
                          resolveCommission(tx)
                        const { date, time } = formatDateDisplay(tx.created_at)
                        const rawStatus = tx.status ?? 'pending'
                        const href = `/sales/transactions/${tx.id ?? paymentRef}`

                        return (
                          <tr key={tx.id}>
                            <td className="whitespace-nowrap px-4 py-4 font-semibold text-[var(--text-main)]">
                              {policyNo}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-[var(--text-sub)]">
                              {certNo}
                            </td>
                            <td className="px-4 py-4">
                              <span className="whitespace-nowrap font-medium text-[var(--text-sub)]">
                                {paymentRef}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-[var(--text-main)] max-w-[220px]">
                              <span className="block font-semibold truncate" title={planName}>
                                {planName}
                              </span>
                              <span className="block text-xs text-[var(--text-sub)] truncate" title={productName}>
                                {productName}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-[var(--text-sub)]">
                              <span className="block">
                                {formatCurrency(premium)}
                              </span>
                              <span className="block text-xs">
                                {`NC ${formatCurrency(comm)}`}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={String(rawStatus)} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-[var(--text-sub)]">
                              <span className="block">{date}</span>
                              {time && (
                                <span className="block text-xs">{time}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <ActionIcon
                                href={href}
                                label={`View transaction ${paymentRef}`}
                                hint="View details"
                              >
                                <ArrowUpRight className="size-5" aria-hidden="true" />
                              </ActionIcon>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Net commission legend ── */}
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Net Commission (NC)
              </p>

              {/* ── Pagination ── */}
              {totalItems > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm tabular-nums text-[var(--text-sub)]">
                    Showing {fromItem}–{toItem} of{' '}
                    {totalItems.toLocaleString()} results
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="sales-rows"
                      className="text-sm text-[var(--text-sub)]"
                    >
                      Rows
                    </label>
                    <select
                      id="sales-rows"
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value))
                        setPage(1)
                      }}
                      className="table-page-select"
                    >
                      {[10, 25].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>

                    <nav
                      aria-label="Cases pagination"
                      className="flex flex-wrap gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#565c58]"
                      >
                        Previous
                      </button>
                      {pageWindow(safePage, totalPages).map((p, i) =>
                        p === '…' ? (
                          <span
                            key={`ellipsis-${i}`}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm text-[var(--text-muted)]"
                            aria-hidden="true"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            aria-current={safePage === p ? 'page' : undefined}
                            aria-label={`Page ${p}`}
                            className={cn(
                              'min-h-11 min-w-11 rounded-md border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]',
                              safePage === p
                                ? 'border-[#006838] bg-[#006838] text-white'
                                : 'border-[var(--border)] text-[var(--text-sub)] hover:bg-[var(--subtle)] dark:border-[#565c58]'
                            )}
                          >
                            {p}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={safePage >= totalPages}
                        className="min-h-11 rounded-md border border-[var(--border)] px-3 text-sm text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#565c58]"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
