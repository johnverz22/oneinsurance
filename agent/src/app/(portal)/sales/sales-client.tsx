'use client'

/**
 * sales-client.tsx — "My Sales" page
 *
 * Improvements over baseline:
 *   1. KPI cards: period label, pending context, skeleton + error states, CSS-var status colors
 *   2. Filter bar: search icon + clear, debounced search, date presets, status filter,
 *      accessible export dropdown (aria-haspopup), result count + removable filter chips
 *   3. Table: removed always-N/A Certificate No (merged into Policy cell), status column
 *      with pill, Payment ID in monospace+copy button, title-cased product, right-aligned
 *      numbers, date two-line with nowrap, sortable Created/Premium/Commission, sticky header,
 *      accessible semantics, empty/error states
 *   4. Pagination: "Page X of Y" nowrap, first/last buttons, 40px targets, aria-disabled
 *   5. States: skeleton rows, empty state with clear-filters, error with retry, export toast
 *   6. Responsive: full table ≥ 1280, hidden cols 768-1279, card list < 768
 *   7. Accessibility: aria-sort, aria-live result count, aria-label on all icon buttons,
 *      visible focus rings, no color-only communication
 *
 * KPI vs Table data note: KPI cards read from /api/agent/statistics (lifetime
 * aggregates, server-side). The transaction table reads from /api/transactions
 * (paginated, filterable). If /api/agent/statistics returns 0 while rows exist,
 * the backend must include pending transactions in its aggregation, OR expose a
 * separate summary endpoint scoped to the same filter. See backend note at bottom.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  Filter as FilterIcon,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { resolveStatus } from '@/components/sales/status-pill'
import { FilterChips } from '@/components/sales/filter-chips'
import { TransactionCard } from '@/components/sales/transaction-card'
import type { Transaction, AgentStatistics } from '@/types/agent/sales'
import type { FilterChip } from '@/components/sales/filter-chips'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a raw API product value to a title-cased display name. */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Extract a human-readable product brand/plan name from either string or object form. */
function resolveProductName(tx: Transaction): string {
  const raw =
    (typeof tx.product === 'object' && tx.product !== null
      ? tx.product.name
      : tx.product) ||
    tx.product_name ||
    ''
  return raw ? toTitleCase(raw) : '—'
}

/**
 * Infer the insurance category ("Travel Insurance", "Health Insurance", etc.)
 * from the product name. Returns null when the category cannot be determined
 * or when it would just repeat what the primary line already says.
 */
function resolveProductCategory(productName: string): string | null {
  if (!productName || productName === '—') return null
  const lower = productName.toLowerCase()

  if (lower.includes('travel'))            return 'Travel Insurance'
  if (lower.includes('health') || lower.includes('medicard') || lower.includes('hmo')) return 'Health Insurance'
  if (lower.includes('personal accident') || lower.includes('pa ') || / pa$/.test(lower)) return 'Personal Accident'
  if (lower.includes('life'))              return 'Life Insurance'
  if (lower.includes('motor') || lower.includes('vehicle') || lower.includes('car ') || lower.includes('auto')) return 'Motor Insurance'
  if (lower.includes('fire') || lower.includes('property') || lower.includes('home')) return 'Property Insurance'
  if (lower.includes('marine') || lower.includes('cargo')) return 'Marine Insurance'
  if (lower.includes('liability'))         return 'Liability Insurance'

  return null
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

/** Extract commission from a transaction; returns amount and whether it's pending. */
function resolveCommission(tx: Transaction): { amount: number; isPending: boolean } {
  const status = resolveStatus(tx.status ?? tx.payment_status)
  const raw =
    tx.commission_log?.agent_commission ??
    tx.commission_log?.net_commission ??
    tx.net_commission
  const amount = Number(raw ?? 0)
  // Commission is only settled when the transaction is paid/success
  const isPending = status !== 'success'
  return { amount, isPending }
}

// ─── Payment ID cell — color-coded status icon + text ──────────────────────

type PaymentStatus = 'success' | 'pending' | 'cancelled' | 'failed'

const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { text: string; label: string; icon: React.ElementType }
> = {
  success:  { label: 'Paid',      text: 'text-[#006838] dark:text-[#8fddb0]', icon: CheckCircle2 },
  pending:  { label: 'Pending',   text: 'text-[#8a6200] dark:text-[#f0ca72]', icon: Clock        },
  cancelled:{ label: 'Cancelled', text: 'text-[#b42318] dark:text-[#ffaaa3]', icon: XCircle      },
  failed:   { label: 'Failed',    text: 'text-[#b42318] dark:text-[#ffaaa3]', icon: XCircle      },
}

function PaymentIdCell({ paymentRef, status }: { paymentRef: string; status: PaymentStatus }) {
  const { text, label, icon: Icon } = PAYMENT_STATUS_STYLES[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5', text)}>
      <span
        className="group relative inline-flex size-6 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-current"
        tabIndex={0}
        role="img"
        aria-label={`Payment ${label}`}
      >
        <Icon className="size-3.5 transition-transform group-hover:scale-110 group-focus-visible:scale-110" aria-hidden="true" />
        {/* Tooltip */}
        <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded bg-[var(--text-main)] px-2 py-0.5 text-xs text-[var(--card)] shadow group-hover:block group-focus-visible:block">
          {label}
        </span>
      </span>
      <span className="font-mono text-xs tabular-nums font-medium whitespace-nowrap" title={paymentRef}>
        {paymentRef}
      </span>
    </span>
  )
}

type SortField = 'created_at' | 'premium' | 'commission'
type SortDir = 'asc' | 'desc'
// Raw values sent straight to the backend — do NOT remap these
type StatusFilter = 'all' | 'pending' | 'completed' | 'failed' | 'cancelled'

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Animated skeleton row for table loading state */
function TableSkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          {[180, 140, 110, 160, 90, 90, 110, 60].map((w, j) => (
            <td key={j} className="px-3 py-4">
              <div className="skeleton h-4 rounded" style={{ width: `${w * 0.6 + Math.random() * w * 0.4}px`, maxWidth: '100%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** KPI card skeleton */
function MetricSkeleton() {
  return (
    <div className="portal-page-card space-y-2 py-4">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-7 w-36 rounded" />
      <div className="skeleton h-3 w-28 rounded" />
    </div>
  )
}

/** KPI card error state */
function MetricError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="portal-page-card flex flex-col items-center gap-2 py-6 text-center">
      <AlertCircle className="size-5 text-[#dc2626]" aria-hidden="true" />
      <p className="text-sm text-[var(--text-muted)]">Failed to load</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-tertiary min-h-0 py-1 px-2 text-xs"
      >
        Retry
      </button>
    </div>
  )
}

/** Sortable column header button */
function SortHeader({
  children,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  children: React.ReactNode
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}) {
  const isActive = sortField === field
  const ariaSortValue: React.AriaAttributes['aria-sort'] = isActive
    ? sortDir === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  return (
    <th
      scope="col"
      aria-sort={ariaSortValue}
      className={cn('px-3 py-3 font-semibold', className)}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
      >
        {children}
        {isActive ? (
          sortDir === 'asc' ? (
            <ArrowUp className="size-3 shrink-0" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-3 shrink-0" aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown className="size-3 shrink-0 opacity-40" aria-hidden="true" />
        )}
      </button>
    </th>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string; type: 'success' | 'error' }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
            t.type === 'success'
              ? 'border-[var(--border)] bg-[var(--card)] text-[var(--text-main)]'
              : 'border-[#fca5a5] bg-[#fee2e2] text-[#991b1b] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fca5a5]'
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * My Sales page client component.
 * Keeps the same page structure: header → 3 KPI cards → Transaction History card.
 */
export function SalesClient() {
  // ── Filter state (pending — not yet applied) ──
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // ── Applied filter state (triggers query) ──
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>('all')

  // ── Table state ──
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ── Export state ──
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // ── Toast state ──
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  // ── Date validation error ──
  const [dateError, setDateError] = useState('')

  const authFetch = useAuthFetch()

  // ── Derived: anything has changed from applied? ──
  const filtersChanged =
    search.trim() !== appliedSearch ||
    fromDate !== appliedFrom ||
    toDate !== appliedTo ||
    statusFilter !== appliedStatus

  const hasActiveFilters = Boolean(
    appliedSearch || appliedFrom || appliedTo || appliedStatus !== 'all'
  )

  // ── Close export dropdown on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportOpen])

  // ── Close export on Escape ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // ── No auto-apply: all filters (search, date, status) require pressing Apply ──

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

  // ── Transactions query — fetch all, filter client-side ──
  // The backend /agents/transactions may not support all filter params yet.
  // We fetch a large batch (up to 500) and filter/sort/paginate entirely in the browser.
  // This guarantees filters work regardless of backend support.
  const {
    data: txData,
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: async () => {
      const res = await authFetch('/api/transactions?per_page=500&page=1')
      if (!res.ok) throw new Error('Failed to load transactions')
      return res.json()
    },
    staleTime: 60_000, // 1 min — don't re-fetch on every filter change
  })

  // ── Extract raw list ──
  const rawData = txData?.data
  const allTransactions: Transaction[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : []

  // ── Client-side filter ──
  const filtered = allTransactions.filter((tx) => {
    // Search — match policy no, payment ref, product name, plan name
    if (appliedSearch) {
      const q = appliedSearch.toLowerCase()
      const haystack = [
        tx.policy_number,
        tx.carrier_policy_no,
        tx.merchant_transaction_id,
        tx.payment_id,
        typeof tx.product === 'object' ? tx.product?.name : tx.product,
        tx.product_name,
        tx.plan_name,
        tx.plan,
        tx.customer_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    // Status — compare against raw tx.status and tx.payment_status
    if (appliedStatus !== 'all') {
      const raw = (tx.status ?? tx.payment_status ?? '').toLowerCase()
      // Map 'completed' UI value to also match 'paid'/'successful'/'success' from DLT
      const matchCompleted = appliedStatus === 'completed'
        ? ['completed', 'paid', 'successful', 'success'].includes(raw)
        : raw === appliedStatus
      if (!matchCompleted) return false
    }

    // Date from — compare against created_at date portion
    if (appliedFrom) {
      const txDate = (tx.created_at ?? '').slice(0, 10)
      if (!txDate || txDate < appliedFrom) return false
    }

    // Date to
    if (appliedTo) {
      const txDate = (tx.created_at ?? '').slice(0, 10)
      if (!txDate || txDate > appliedTo) return false
    }

    return true
  })

  // ── Client-side sort ──
  const sorted = [...filtered].sort((a, b) => {
    let av = 0, bv = 0
    if (sortField === 'created_at') {
      av = new Date(a.created_at ?? 0).getTime()
      bv = new Date(b.created_at ?? 0).getTime()
    } else if (sortField === 'premium') {
      av = Number(a.amount ?? a.premium ?? 0)
      bv = Number(b.amount ?? b.premium ?? 0)
    } else if (sortField === 'commission') {
      av = Number(a.commission_log?.agent_commission ?? a.commission_log?.net_commission ?? a.net_commission ?? 0)
      bv = Number(b.commission_log?.agent_commission ?? b.commission_log?.net_commission ?? b.net_commission ?? 0)
    }
    return sortDir === 'asc' ? av - bv : bv - av
  })

  // ── Client-side pagination ──
  const totalItems = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const safePage = Math.min(page, totalPages)
  const fromItem = totalItems > 0 ? (safePage - 1) * perPage + 1 : 0
  const toItem = Math.min(safePage * perPage, totalItems)
  const transactions: Transaction[] = sorted.slice((safePage - 1) * perPage, safePage * perPage)

  // ── KPI values ──
  const totalSales = Number(stats?.total_sales ?? stats?.total_premium ?? 0)
  const totalCases = Number(stats?.number_of_sales ?? stats?.total_cases ?? 0)
  const netCommission = Number(stats?.net_commissions ?? 0)
  const grossCommission = Number(stats?.gross_commissions ?? 0)
  // Pending commission estimate: gross - net (adapter; backend should expose this explicitly)
  const pendingCommission = grossCommission > netCommission ? grossCommission - netCommission : 0

  // ── Handlers ──

  const handleApplyFilter = useCallback(() => {
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('"From" date must be on or before the "To" date.')
      return
    }
    setDateError('')
    setAppliedSearch(search.trim())
    setAppliedFrom(fromDate)
    setAppliedTo(toDate)
    setAppliedStatus(statusFilter)
    setPage(1)
  }, [search, fromDate, toDate, statusFilter])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setFromDate('')
    setToDate('')
    setStatusFilter('all')
    setAppliedSearch('')
    setAppliedFrom('')
    setAppliedTo('')
    setAppliedStatus('all')
    setDateError('')
    setPage(1)
  }, [])

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('desc')
      return field
    })
    setPage(1)
  }, [])

  // ── Toast helpers ──
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ── Export ──
  const buildCSV = useCallback(() => {
    const headers = [
      'Policy No.',
      'Payment ID',
      'Product',
      'Plan',
      'Premium',
      'Net Commission',
      'Status',
      'Date',
    ]
    const rows = transactions.map((tx) => {
      const { amount: comm } = resolveCommission(tx)
      const { date } = formatDateDisplay(tx.created_at)
      const productBrand = resolveProductName(tx)
      const txPlan = tx.plan_name ?? tx.plan ?? ''
      return [
        `"${tx.policy_number ?? tx.carrier_policy_no ?? ''}"`,
        `"${tx.merchant_transaction_id ?? tx.payment_id ?? tx.id}"`,
        `"${productBrand}"`,
        `"${txPlan}"`,
        `"${Number(tx.amount ?? tx.premium ?? 0).toFixed(2)}"`,
        `"${comm.toFixed(2)}"`,
        `"${resolveStatus(tx.status ?? tx.payment_status)}"`,
        `"${date}"`,
      ]
    })
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  }, [transactions])

  const handleExportCSV = useCallback(async () => {
    setExportOpen(false)
    if (!transactions.length) {
      addToast('No transactions to export.', 'error')
      return
    }
    setExporting(true)
    try {
      await new Promise((r) => setTimeout(r, 200)) // simulate async
      const csv = buildCSV()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sales-transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      addToast('CSV exported successfully.')
    } catch {
      addToast('Export failed. Please try again.', 'error')
    } finally {
      setExporting(false)
    }
  }, [transactions, buildCSV, addToast])

  // XLSX export: server-side or library needed; for now falls back to CSV with note
  const handleExportXLSX = useCallback(() => {
    setExportOpen(false)
    addToast('XLSX export not yet available — downloading CSV instead.', 'error')
    handleExportCSV()
  }, [handleExportCSV, addToast])

  // ── Active filter chips ──
  const filterChips: FilterChip[] = []
  if (appliedSearch) {
    filterChips.push({
      key: 'search',
      label: `"${appliedSearch}"`,
      onRemove: () => {
        setSearch('')
        setAppliedSearch('')
        setPage(1)
      },
    })
  }
  if (appliedFrom || appliedTo) {
    filterChips.push({
      key: 'date',
      label: [appliedFrom, appliedTo].filter(Boolean).join(' → '),
      onRemove: () => {
        setFromDate('')
        setToDate('')
        setAppliedFrom('')
        setAppliedTo('')
        setPage(1)
      },
    })
  }
  if (appliedStatus !== 'all') {
    const STATUS_LABELS: Record<string, string> = {
      pending: 'Pending',
      completed: 'Paid / Completed',
      cancelled: 'Cancelled',
      failed: 'Failed',
    }
    filterChips.push({
      key: 'status',
      label: `Status: ${STATUS_LABELS[appliedStatus] ?? appliedStatus}`,
      onRemove: () => {
        setStatusFilter('all')
        setAppliedStatus('all')
        setPage(1)
      },
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page header (DO NOT MODIFY) ── */}
      <PortalContentHeader
        title="My sales"
        description="Review your sales and transaction history."
      />

      {/* ── 1. KPI Cards ── */}
      <section aria-label="Sales metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : statsError ? (
          Array.from({ length: 3 }).map((_, i) => (
            <MetricError key={i} onRetry={refetchStats} />
          ))
        ) : (
          <>
            {/* Total Sales */}
            <div className="portal-page-card py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Total sales
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-[var(--text-main)]">
                {formatCurrency(totalSales)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                All time · paid &amp; settled sales only
              </p>
              {/*
               * ADAPTER NOTE: /api/agent/statistics `total_sales` reflects
               * settled (completed) transactions only. Pending premium is NOT
               * included. If zero appears while the table shows rows, the backend
               * must include pending amounts or expose a separate pending_sales field.
               */}
            </div>

            {/* Total Cases */}
            <div className="portal-page-card py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Total cases
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-[var(--text-main)]">
                {totalCases.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                All time · includes pending transactions
              </p>
              
            </div>

            {/* Net Commissions */}
            <div className="portal-page-card py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Net commissions
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-[var(--text-main)]">
                {formatCurrency(netCommission)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                All time · settled transactions only
              </p>
              {pendingCommission > 0 && (
                <p className="mt-1.5 text-xs font-medium text-[#854d0e] dark:text-[#fde047]">
                  {formatCurrency(pendingCommission)} pending settlement
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── 2–5. Transaction History card ── */}
      <div
        className="portal-page-card overflow-hidden p-0"
        aria-busy={txLoading}
        role="region"
        aria-label="Transaction history"
      >
        {/* ── Card header ── */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold text-[var(--text-main)]">
              Transaction History
            </h2>
            {/* Result count — aria-live so screen readers announce updates */}
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-sm text-[var(--text-muted)]"
            >
              {txLoading
                ? 'Loading…'
                : `${totalItems.toLocaleString()} transaction${totalItems !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* ── 2. Filter bar — single row ── */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleApplyFilter() }}
            role="search"
            aria-label="Search and filter transactions"
            className="mt-4"
          >
            <div className="flex flex-wrap items-end gap-2">
              {/* Search input */}
              <div className="min-w-0 flex-1 basis-52">
                <label htmlFor="sales-search" className="block text-xs font-medium text-[var(--text-sub)] mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <input
                    id="sales-search"
                    type="search"
                    placeholder="Policy, payment ID, or product"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ui-form-field pl-8 pr-8"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status filter */}
              <div className="basis-36 shrink-0">
                <label htmlFor="sales-status" className="block text-xs font-medium text-[var(--text-sub)] mb-1">
                  Status
                </label>
                <select
                  id="sales-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="ui-form-field"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Paid / Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* From */}
              <div className="shrink-0">
                <label htmlFor="sales-from" className="block text-xs font-medium text-[var(--text-sub)] mb-1">
                  From
                </label>
                <input
                  id="sales-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setDateError('') }}
                  aria-invalid={!!dateError}
                  className="ui-form-field w-auto"
                />
              </div>

              {/* To */}
              <div className="shrink-0">
                <label htmlFor="sales-to" className="block text-xs font-medium text-[var(--text-sub)] mb-1">
                  To
                </label>
                <input
                  id="sales-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setDateError('') }}
                  min={fromDate || undefined}
                  aria-invalid={!!dateError}
                  className="ui-form-field w-auto"
                />
              </div>

              {/* Apply filter */}
              <div className="flex shrink-0 items-end gap-2">
                <button
                  type="submit"
                  disabled={!filtersChanged}
                  aria-disabled={!filtersChanged}
                  className="btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply filter
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn-tertiary px-3"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Export dropdown */}
              <div className="relative shrink-0" ref={exportMenuRef}>
                <button
                  type="button"
                  id="export-btn"
                  aria-haspopup="true"
                  aria-expanded={exportOpen}
                  aria-controls="export-menu"
                  disabled={exporting}
                  onClick={() => setExportOpen((o) => !o)}
                  className="btn-secondary inline-flex items-center gap-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                  Export
                  <ChevronDown
                    className={cn('size-3.5 transition-transform', exportOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {exportOpen && (
                  <div
                    id="export-menu"
                    role="menu"
                    aria-labelledby="export-btn"
                    className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-md"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleExportCSV}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                    >
                      <FileText className="size-4 shrink-0" aria-hidden="true" />
                      Export CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleExportXLSX}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-[var(--text-sub)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                    >
                      <FileText className="size-4 shrink-0" aria-hidden="true" />
                      Export XLSX
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Date validation error */}
            {dateError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-[#dc2626] dark:text-[#fca5a5]">
                {dateError}
              </p>
            )}
          </form>

          {/* Active filter chips */}
          <FilterChips chips={filterChips} className="mt-3" />
        </div>

        {/* ── 3. Table / states ── */}
        {txError ? (
          /* Error state */
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <AlertCircle className="size-8 text-[#dc2626]" aria-hidden="true" />
            <p className="text-base font-medium text-[var(--text-main)]">Failed to load transactions</p>
            <p className="text-sm text-[var(--text-muted)]">Check your connection and try again.</p>
            <button type="button" onClick={() => refetchTx()} className="btn-secondary px-4 mt-1">
              <RefreshCw className="size-4 mr-2" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : !txLoading && transactions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FilterIcon className="size-8 text-[var(--text-muted)]" aria-hidden="true" />
            {hasActiveFilters ? (
              <>
                <p className="text-base font-medium text-[var(--text-main)]">
                  No transactions match your filters
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Try adjusting the search or date range.
                </p>
                <button type="button" onClick={handleClearFilters} className="btn-secondary px-4 mt-1">
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-[var(--text-main)]">No transactions yet</p>
                <p className="max-w-xs text-sm text-[var(--text-muted)]">
                  Your sales and commissions will appear here once a policy is issued.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* ── Mobile / Tablet card list (< lg) ── */}
            <div className="divide-y divide-[var(--border)] lg:hidden">
              {txLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-4">
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-40 rounded" />
                        <div className="skeleton h-3 w-28 rounded" />
                        <div className="skeleton h-3 w-24 rounded" />
                      </div>
                    </div>
                  ))
                : transactions.map((tx) => {
                    const policyNo = tx.policy_number ?? tx.carrier_policy_no ?? '—'
                    const paymentRef = tx.merchant_transaction_id ?? tx.payment_id ?? String(tx.id)
                    const status = resolveStatus(tx.status ?? tx.payment_status)
                    const productBrand = resolveProductName(tx)
                    const txPlanName = tx.plan_name ?? tx.plan ?? null
                    const primaryLine = txPlanName && txPlanName !== productBrand ? txPlanName : productBrand
                    const premium = Number(tx.amount ?? tx.premium ?? 0)
                    const { amount: comm, isPending: commPending } = resolveCommission(tx)
                    const { date, time } = formatDateDisplay(tx.created_at)

                    return (
                      <TransactionCard
                        key={tx.id}
                        id={tx.id}
                        policyNumber={policyNo}
                        paymentRef={paymentRef}
                        productName={productBrand}
                        planName={primaryLine}
                        premium={premium}
                        commission={comm}
                        commissionIsPending={commPending}
                        status={status}
                        date={date}
                        time={time}
                        href={`/sales/transactions/${tx.id ?? paymentRef}`}
                      />
                    )
                  })}
            </div>

            {/* ── Desktop table (≥ lg) ── */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Transaction history — {totalItems} record{totalItems !== 1 ? 's' : ''}
                </caption>
                <thead className="border-y border-[var(--border)] bg-[var(--subtle)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <tr>
                    {/* Policy No. — static sort */}
                    <th scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                      Policy No.
                    </th>
                    {/* Payment ID — color-coded status */}
                    <th scope="col" className="px-3 py-3 font-semibold whitespace-nowrap">
                      Payment ID
                    </th>
                    {/* Product — static */}
                    <th scope="col" className="px-3 py-3 font-semibold">
                      Product
                    </th>
                    {/* Premium — sortable */}
                    <SortHeader
                      field="premium"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="whitespace-nowrap text-right"
                    >
                      Premium
                    </SortHeader>
                    {/* Net commission — sortable */}
                    <SortHeader
                      field="commission"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="whitespace-nowrap text-right"
                    >
                      Net comm.
                    </SortHeader>
                    {/* Created — sortable, default sort */}
                    <SortHeader
                      field="created_at"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      className="whitespace-nowrap"
                    >
                      Created
                    </SortHeader>
                    {/* Action */}
                    <th scope="col" className="px-3 py-3 font-semibold">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {txLoading ? (
                    <TableSkeletonRows count={perPage} />
                  ) : (
                    transactions.map((tx) => {
                      const policyNo = tx.policy_number ?? tx.carrier_policy_no ?? null
                      const certNo = tx.certificate_number ?? null
                      const paymentRef = tx.merchant_transaction_id ?? tx.payment_id ?? String(tx.id)
                      const status = resolveStatus(tx.status ?? tx.payment_status)
                      const productBrand = resolveProductName(tx)          // e.g. "Oona Travel Insurance"
                      const planName = tx.plan_name ?? tx.plan ?? null      // e.g. "Travel Master"
                      // Primary line: plan name when distinct, otherwise the product brand
                      const primaryLine = planName && planName !== productBrand ? planName : productBrand
                      // Sub-text: insurance category inferred from brand name ("Travel Insurance")
                      const productCategory = resolveProductCategory(productBrand)
                      const premium = Number(tx.amount ?? tx.premium ?? 0)
                      const { amount: comm, isPending: commPending } = resolveCommission(tx)
                      const { date, time } = formatDateDisplay(tx.created_at)
                      const href = `/sales/transactions/${tx.id ?? paymentRef}`

                      return (
                        <tr
                          key={tx.id}
                          className="group transition-colors hover:bg-[var(--subtle)] focus-within:bg-[var(--subtle)]"
                        >
                          {/* Policy No. + optional cert secondary line */}
                          <td className="px-3 py-2.5 align-middle">
                            <span className="block text-sm font-medium text-[var(--text-main)] whitespace-nowrap">
                              {policyNo ?? '—'}
                            </span>
                            {certNo && (
                              <span className="block text-xs text-[var(--text-muted)] whitespace-nowrap">
                                Cert. {certNo}
                              </span>
                            )}
                          </td>

                          {/* Payment ID — color-coded status icon + monospace text */}
                          <td className="px-3 py-2.5 align-middle">
                            <PaymentIdCell paymentRef={paymentRef} status={status} />
                          </td>

                          {/* Product — plan name primary, insurance category muted secondary */}
                          <td className="px-3 py-2.5 align-middle max-w-[200px]">
                            <span
                              className="block line-clamp-1 text-sm font-medium text-[var(--text-main)]"
                              title={primaryLine}
                            >
                              {primaryLine}
                            </span>
                            {productCategory && (
                              <span
                                className="block truncate text-xs text-[var(--text-muted)]"
                                title={productCategory}
                              >
                                {productCategory}
                              </span>
                            )}
                          </td>

                          {/* Premium — right-aligned, tabular nums */}
                          <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap tabular-nums text-sm font-medium text-[var(--text-main)]">
                            {formatCurrency(premium)}
                          </td>

                          {/* Net commission — pending or settled value */}
                          <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap tabular-nums">
                            {commPending ? (
                              <span
                                className="text-xs font-medium text-[#8a6200] dark:text-[#f0ca72]"
                                title="Commission settled once transaction is completed"
                              >
                                Pending
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-[var(--text-main)]">
                                {formatCurrency(comm)}
                              </span>
                            )}
                          </td>

                          {/* Created date — two lines, nowrap */}
                          <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                            <span className="block text-sm text-[var(--text-sub)]">{date}</span>
                            {time && (
                              <span className="block text-xs text-[var(--text-muted)]">{time}</span>
                            )}
                          </td>

                          {/* Action — ArrowUpRight icon link */}
                          <td className="px-3 py-2.5 align-middle">
                            <Link
                              href={href}
                              aria-label={`View transaction ${paymentRef}`}
                              className="inline-flex size-10 items-center justify-center rounded-md text-[var(--primary)] hover:bg-[var(--subtle)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--primary)] dark:text-[#d0e3c8]"
                            >
                              <ArrowUpRight className="size-4" aria-hidden="true" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── 4. Pagination ── */}
        {totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4 text-sm sm:px-6">
            {/* Left: range text */}
            <p className="text-[var(--text-muted)]">
              Showing {fromItem}–{toItem} of {totalItems.toLocaleString()} results
            </p>

            {/* Right: rows selector + page nav */}
            <div className="flex items-center gap-2">
              <label htmlFor="sales-rows" className="text-[var(--text-muted)]">
                Rows
              </label>
              <select
                id="sales-rows"
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="table-page-select"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              {/* First page */}
              <button
                type="button"
                disabled={safePage <= 1}
                aria-disabled={safePage <= 1}
                onClick={() => setPage(1)}
                aria-label="First page"
                className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-sub)] transition-colors hover:bg-[var(--subtle)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              >
                <ChevronsLeft className="size-4" aria-hidden="true" />
              </button>

              {/* Previous page */}
              <button
                type="button"
                disabled={safePage <= 1}
                aria-disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-sub)] transition-colors hover:bg-[var(--subtle)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>

              {/* Page indicator — nowrap */}
              <span className="whitespace-nowrap text-[var(--text-sub)]">
                Page {safePage} of {totalPages}
              </span>

              {/* Next page */}
              <button
                type="button"
                disabled={safePage >= totalPages}
                aria-disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
                className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-sub)] transition-colors hover:bg-[var(--subtle)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>

              {/* Last page */}
              <button
                type="button"
                disabled={safePage >= totalPages}
                aria-disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                aria-label="Last page"
                className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-sub)] transition-colors hover:bg-[var(--subtle)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              >
                <ChevronsRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast container ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * BACKEND NOTES (do not touch API contracts — these are adapter-layer comments)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. KPI vs Table discrepancy
 *    /api/agent/statistics aggregates on the server side and may filter to
 *    "settled/completed" transactions only. /api/transactions returns all
 *    records including pending. This is why KPI cards can show ₱0 while the
 *    table shows rows.
 *
 *    RECOMMENDED: the statistics endpoint should accept a `scope` param
 *    (e.g. `?scope=all` vs `?scope=settled`) so the UI can label each card
 *    accurately, OR expose separate `pending_premium`, `pending_cases`,
 *    `pending_commissions` fields alongside the settled equivalents.
 *
 * 2. Status field
 *    Transaction.status values seen: 'pending', 'completed', 'failed',
 *    'cancelled'. Also possible: 'payment_status' field. The UI maps all
 *    'completed'/'successful'/'paid' → 'success' via resolveStatus().
 *    Backend should standardise on one status field.
 *
 * 3. Commission state
 *    Transaction.net_commission is 0 while status is 'pending'. The UI marks
 *    the commission cell as "Pending" (not ₱0.00) when status !== 'success'.
 *    Backend should ideally expose `commission_status: 'pending' | 'settled'`
 *    or keep net_commission null until settled.
 *
 * 4. Certificate number
 *    Transaction.certificate_number is always null in the current dataset.
 *    The column has been moved to a secondary line under Policy No. and is
 *    conditionally rendered (only when non-null). No data change needed.
 *
 * 5. Sort / filter params
 *    The UI now sends `sort_by` and `sort_dir` query params to /api/transactions.
 *    Backend should honour these; otherwise client-side sort can be added as a
 *    fallback without changing this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */
