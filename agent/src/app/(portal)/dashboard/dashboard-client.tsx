'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  CreditCard,
  LayoutList,
  ClipboardList,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { subDays, format, parseISO } from 'date-fns'
import { useAgentUser } from '@/store/agent-auth-store'
import { cn, formatCurrency, STOREFRONT_BASE_URL } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { usePortalSearchStore } from '@/store/portal-search-store'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import type { AgentStatistics, Transaction } from '@/types/agent/sales'

// ---- Chart period select (mockup: 7 days / 15 days / 1 month / 3 months / 1 year) ----
type Period = '7d' | '15d' | '1mo' | '3mo' | '1yr'

const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '15d', label: '15 days', days: 15 },
  { id: '1mo', label: '1 month', days: 30 },
  { id: '3mo', label: '3 months', days: 90 },
  { id: '1yr', label: '1 year', days: 365 },
]

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 days',
  '15d': 'Last 15 days',
  '1mo': 'Last 30 days',
  '3mo': 'Last 90 days',
  '1yr': 'Last 365 days',
}

function periodDays(period: Period): number {
  return PERIODS.find((p) => p.id === period)?.days ?? 7
}

function buildDateParams(period: Period): { date_from: string; date_to: string } {
  const now = new Date()
  const date_to = format(now, 'yyyy-MM-dd')
  const date_from = format(subDays(now, periodDays(period) - 1), 'yyyy-MM-dd')
  return { date_from, date_to }
}

// ---- Quick-action item ----
type QuickActionProps = {
  href?: string
  title: string
  subtitle: string
  icon: React.ReactNode
  onClick?: () => void
}

function QuickActionCard({ href, title, subtitle, icon, onClick }: QuickActionProps) {
  const inner = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#e6f2e8] text-[#006838] transition-colors duration-200 group-hover:bg-[#f8efd8] group-hover:text-[#006838] dark:bg-[#3d5242] dark:text-[#d0e3c8] dark:group-hover:bg-[#f8efd8] dark:group-hover:text-[#006838]">
        {icon}
      </span>
      <span>
        <strong className="block text-base leading-5 text-[var(--text-main)]">
          {title}
        </strong>
        <small className="mt-1 block text-base leading-5 text-[var(--text-sub)]">
          {subtitle}
        </small>
      </span>
    </>
  )
  const cls =
    'agent-dashboard__action group flex min-h-[116px] w-full flex-col items-start justify-between rounded-md border border-[#e0e9e0] bg-[#fbfcfa] p-4 text-left transition hover:border-[#006838] hover:bg-transparent dark:border-[#475049] dark:bg-[#171919] dark:hover:border-[#006838] dark:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-[#006838]'
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

// ---- Status indicator ----
function StatusLabel({ status }: { status?: string }) {
  const s = (status || '').toLowerCase()
  if (s === 'success' || s === 'completed' || s === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006838] dark:text-[#5fd488]">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </span>
    )
  }
  if (s === 'rejected' || s === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#dc2626] dark:text-[#f87171]">
        <XCircle className="h-3 w-3" /> Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d97706] dark:text-[#fbbf24]">
      <Clock className="h-3 w-3" /> Pending
    </span>
  )
}

/**
 * Agent portal dashboard.
 * Live integration with backend API.
 */
export function DashboardClient() {
  const user = useAgentUser()
  const authFetch = useAuthFetch()
  const { searchQuery, setSearchQuery } = usePortalSearchStore()
  const [period, setPeriod] = useState<Period>('7d')
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)
  const [policiesPreviewOpen, setPoliciesPreviewOpen] = useState(false)
  const policiesDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = policiesDialogRef.current
    if (!dialog) return
    if (policiesPreviewOpen && !dialog.open) dialog.showModal()
    if (!policiesPreviewOpen && dialog.open) dialog.close()
  }, [policiesPreviewOpen])

  // 1. All-time portfolio statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AgentStatistics>({
    queryKey: ['agent-statistics'],
    queryFn: async () => {
      const res = await authFetch('/api/agent/statistics')
      if (!res.ok) throw new Error('Failed to load statistics')
      const json = await res.json()
      return json.data || json
    },
  })

  // 2. Active products/lobs count
  const { data: lobsData } = useQuery<{ total?: number; data?: unknown[] }>({
    queryKey: ['agent-lobs-count'],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/agent/lobs')
        if (!res.ok) return { total: 0 }
        return await res.json()
      } catch {
        return { total: 0 }
      }
    },
  })

  // 3. Trend statistics for the selected period
  const { date_from, date_to } = buildDateParams(period)
  const { data: trendData, isLoading: trendLoading } = useQuery<AgentStatistics>({
    queryKey: ['agent-statistics-trend', period],
    queryFn: async () => {
      const params = new URLSearchParams({ date_from, date_to })
      const res = await authFetch(`/api/agent/statistics?${params}`)
      if (!res.ok) throw new Error('Failed to load trend')
      const json = await res.json()
      return json.data || json
    },
  })

  // 4. Recent activity — temporary fallback querying sales transactions (/api/transactions)
  // until dedicated system-wide activity endpoint (GET /api/v1/agents/activities) is deployed.
  const { data: recentTx, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const res = await authFetch('/api/transactions?per_page=15&page=1')
      if (!res.ok) throw new Error('Failed to load transactions')
      const json = await res.json()
      const rawList = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.data)
          ? json.data.data
          : []
      return rawList
    },
  })

  // 5. Agent referral code
  const { data: referralCodeData } = useQuery({
    queryKey: ['referralCode', user?.id],
    queryFn: async () => {
      try {
        const res = await authFetch(`/api/agent/referral?id=${user?.id || ''}`)
        if (!res.ok) return null
        const json = await res.json()
        return typeof json.data === 'string' ? json.data : json.data?.referral_code || null
      } catch {
        return null
      }
    },
    enabled: !!user?.id,
  })

  // Metric values with real data
  const totalSales = Number(stats?.total_sales ?? stats?.total_premium ?? 0)
  const totalCases = Number(stats?.number_of_sales ?? stats?.total_cases ?? 0)
  const netCommission = Number(stats?.net_commissions ?? stats?.gross_commissions ?? 0)
  const productsCount = Number(
    stats?.number_of_products ??
      stats?.products_count ??
      lobsData?.total ??
      (Array.isArray(lobsData?.data) ? lobsData.data.length : 0)
  )

  // Real written premium for the selected period
  const periodPremium = Number(trendData?.total_sales ?? trendData?.total_premium ?? 0)

  // Chart bars — daily buckets for ranges up to 31 days, equal-width
  // interval buckets for longer ranges (mockup scrolls wide charts)
  const chartBars = useMemo(() => {
    const rawDaily = (trendData as Record<string, unknown> | undefined)
      ?.daily_premiums as Record<string, number | string> | undefined
    const now = new Date()
    const days = periodDays(period)
    const barCount = days <= 31 ? days : Math.min(13, Math.ceil(days / 7))

    const bars = Array.from({ length: barCount }).map((_, idx) => {
      // idx 0 = oldest … idx barCount-1 = today
      const isDaily = barCount === days
      const segStart = isDaily
        ? days - 1 - idx
        : Math.round(((barCount - 1 - idx) * (days - 1)) / barCount)
      const segEnd = isDaily
        ? days - 1 - idx
        : Math.round(((barCount - idx) * (days - 1)) / barCount)
      const startDate = subDays(now, segEnd)
      const endDate = subDays(now, segStart)
      const label = isDaily
        ? format(endDate, 'EEE')[0]
        : format(startDate, 'MMM d')
      const dateStr = isDaily
        ? format(endDate, 'MMM d, yyyy')
        : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`

      let amount = 0
      if (rawDaily && typeof rawDaily === 'object' && !Array.isArray(rawDaily)) {
        Object.entries(rawDaily).forEach(([dKey, val]) => {
          const entryDate = new Date(`${dKey}T00:00:00`)
          if (entryDate >= startDate && entryDate <= endDate) {
            amount += Number(val) || 0
          }
        })
      } else if (recentTx && recentTx.length > 0) {
        amount = recentTx
          .filter((tx) => {
            if (!tx.created_at) return false
            const txDate = new Date(tx.created_at)
            return txDate >= startDate && txDate <= endDate
          })
          .reduce((sum, tx) => sum + Number(tx.amount ?? tx.premium ?? 0), 0)
      }

      return { label, dateStr, amount }
    })

    const maxVal = Math.max(...bars.map((b) => b.amount), 0)
    return bars.map((b) => ({
      ...b,
      heightPct:
        maxVal > 0 && b.amount > 0
          ? Math.max(10, Math.round((b.amount / maxVal) * 100))
          : 0,
    }))
  }, [trendData, recentTx, period])

  // Filter recent activity based on search query
  const filteredActivity = useMemo(() => {
    if (!recentTx) return []
    if (!searchQuery.trim()) return recentTx

    const q = searchQuery.toLowerCase().trim()
    return recentTx.filter((tx) => {
      const rawProduct =
        tx.product_name ??
        tx.line_of_business ??
        (typeof tx.product === 'object' && tx.product !== null
          ? tx.product.name
          : null) ??
        ''
      const productName = String(rawProduct || '')
      const planName = String(tx.plan_name ?? '')
      const paymentRef = String(
        tx.merchant_transaction_id ??
          tx.policy_number ??
          tx.certificate_number ??
          tx.proposal_number ??
          tx.payment_id ??
          tx.id ??
          ''
      )
      const customer = String(tx.customer_name ?? tx.policy_holder ?? '')
      const status = String(tx.status ?? tx.payment_status ?? tx.transaction_status ?? '')
      const amount = String(tx.amount ?? tx.paid_amount ?? tx.premium ?? '')

      return (
        productName.toLowerCase().includes(q) ||
        planName.toLowerCase().includes(q) ||
        paymentRef.toLowerCase().includes(q) ||
        customer.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        amount.includes(q)
      )
    })
  }, [recentTx, searchQuery])

  return (
    <>
      <div className="space-y-6">
        {/* Page heading — the portal top bar's Quick search filters activity below */}
        <PortalContentHeader
        title="Dashboard"
        description="A clear view of your portfolio, progress, and next steps."
      />

      {statsLoading ? (
        <div role="status" aria-label="Loading dashboard">
          <span className="sr-only">Loading dashboard</span>
          <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <section
                  key={i}
                  className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-5"
                >
                  <div className="h-4 w-28 rounded bg-leaf-20 dark:bg-ink-31" />
                  <div className="h-8 w-32 rounded bg-leaf-20 dark:bg-ink-31" />
                  <div className="h-4 w-36 rounded bg-leaf-20 dark:bg-ink-31" />
                </section>
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
              <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-6">
                <div className="h-6 w-40 rounded bg-leaf-20 dark:bg-ink-31" />
                <div className="h-44 rounded bg-leaf-20 dark:bg-ink-31" />
                <div className="flex justify-between gap-3">
                  <div className="h-4 w-20 rounded bg-leaf-20 dark:bg-ink-31" />
                  <div className="h-4 w-20 rounded bg-leaf-20 dark:bg-ink-31" />
                </div>
              </section>
              <section className="agent-dashboard__panel min-w-0 border-border p-5 sm:p-6 space-y-5">
                <div className="h-6 w-36 rounded bg-leaf-20 dark:bg-ink-31" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded bg-leaf-20 dark:bg-ink-31" />
                ))}
              </section>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Portfolio Overview Metrics */}
      <section aria-labelledby="overview-title">
        <h2 id="overview-title" className="sr-only">
          Portfolio overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {/* Total Cases */}
          <article className="agent-dashboard__metric min-w-0">
            <h3 className="agent-dashboard__metric-label text-[var(--text-main)]">
              Total cases
            </h3>
            <span className="agent-dashboard__metric-icon flex items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
              <FileText className="size-5" />
            </span>
            <p className="agent-dashboard__metric-value portal-metric-value font-semibold tracking-tight text-[var(--text-main)]">
              {statsLoading ? '…' : totalCases}
            </p>
            <p className="agent-dashboard__metric-description text-[var(--text-sub)]">
              Across your portfolio
            </p>
          </article>

          {/* Total Premium */}
          <article className="agent-dashboard__metric min-w-0">
            <h3 className="agent-dashboard__metric-label text-[var(--text-main)]">
              Total premium
            </h3>
            <span className="agent-dashboard__metric-icon flex items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
              <CreditCard className="size-5" />
            </span>
            <p className="agent-dashboard__metric-value portal-metric-value font-semibold tracking-tight text-[var(--text-main)]">
              {statsLoading ? '…' : formatCurrency(totalSales)}
            </p>
            <p className="agent-dashboard__metric-description text-[var(--text-sub)]">
              Illustrative value
            </p>
          </article>

          {/* Net Commissions */}
          <article className="agent-dashboard__metric min-w-0">
            <h3 className="agent-dashboard__metric-label text-[var(--text-main)]">
              Net commissions
            </h3>
            <span className="agent-dashboard__metric-icon flex items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
              <CreditCard className="size-5" />
            </span>
            <p className="agent-dashboard__metric-value portal-metric-value font-semibold tracking-tight text-[var(--text-main)]">
              {statsLoading ? '…' : formatCurrency(netCommission)}
            </p>
            <p className="agent-dashboard__metric-description text-[var(--text-sub)]">
              Illustrative earnings
            </p>
          </article>

          {/* Products */}
          <article className="agent-dashboard__metric min-w-0">
            <h3 className="agent-dashboard__metric-label text-[var(--text-main)]">
              Products
            </h3>
            <span className="agent-dashboard__metric-icon flex items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
              <LayoutList className="size-5" />
            </span>
            <p className="agent-dashboard__metric-value portal-metric-value font-semibold tracking-tight text-[var(--text-main)]">
              {statsLoading ? '…' : productsCount}
            </p>
            <p className="agent-dashboard__metric-description text-[var(--text-sub)]">
              In your catalogue
            </p>
          </article>
        </div>
      </section>

      {/* 3. Middle Row: Premium Trend Chart + Quick Actions */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)] xl:gap-x-[18px] xl:gap-y-[14px]">
        {/* Premium Trend Panel */}
        <section
          aria-labelledby="trend-title"
          className="agent-dashboard__panel min-w-0 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="trend-title" className="text-lg font-semibold tracking-tight sm:text-xl text-[var(--text-main)]">
                Premium trend
              </h2>
            </div>
            <label htmlFor="premium-trend-range" className="sr-only">
              Chart date range
            </label>
            <select
              id="premium-trend-range"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="ui-form-field w-auto font-semibold"
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="text-sm text-[var(--text-sub)]">Written premium</p>
              <p className="portal-metric-value mt-1 font-semibold tracking-tight text-[var(--text-main)]">
                {trendLoading ? '…' : formatCurrency(periodPremium)}
              </p>
            </div>
            <span className="ui-status-badge ui-status-badge--info">
              <span>{PERIOD_LABELS[period]}</span>
            </span>
          </div>

          {/* Bar Chart using real data — scrolls horizontally on narrow widths */}
          <div className="mt-2 overflow-x-auto" tabIndex={0} aria-label="Scroll premium chart">
            <div className="pt-12" style={{ minWidth: `${Math.max(chartBars.length, 7) * 48}px` }}>
              {trendLoading ? (
                <div className="flex h-46 items-end gap-2 border-b border-[#dce6dd] pb-2 dark:border-[#465049] sm:gap-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton flex-1 rounded-t-lg"
                      style={{ height: `${25 + ((i * 19) % 55)}%` }}
                    />
                  ))}
                </div>
              ) : chartBars.every((b) => b.heightPct === 0) ? (
                <div className="flex h-46 items-center justify-center border-b border-[#dce6dd] pb-2 dark:border-[#465049]">
                  <p className="text-sm text-[var(--text-muted)]">
                    No premium data for this period.
                  </p>
                </div>
              ) : (
                <div
                  className="agent-dashboard__chart grid h-46 items-end gap-2 border-b border-[#dce6dd] pb-2 dark:border-[#465049] sm:gap-4"
                  style={{ gridTemplateColumns: `repeat(${chartBars.length}, minmax(0, 1fr))` }}
                  aria-label="Written premium bar chart"
                >
                  {chartBars.map((bar, idx) => {
                    const isHovered = hoveredBarIndex === idx

                    return (
                      <div
                        key={idx}
                        className="group relative flex h-full items-end justify-center"
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      >
                        {/* Tooltip on hover */}
                        {isHovered && (
                          <div
                            className={cn(
                              'pointer-events-none absolute -top-11 z-20 whitespace-nowrap rounded-md bg-[#183d2c] px-2.5 py-1 text-xs font-semibold text-white shadow-md dark:bg-[#282c29] dark:border dark:border-[#48524a]',
                              idx === 0
                                ? 'left-0 translate-x-0'
                                : idx === chartBars.length - 1
                                ? 'right-0 translate-x-0'
                                : 'left-1/2 -translate-x-1/2'
                            )}
                          >
                            <p className="text-[11px] leading-tight text-[#d7ecdb]">{bar.dateStr}</p>
                            <p className="text-xs font-bold leading-tight text-[#5fd488]">{formatCurrency(bar.amount)}</p>
                            <div
                              className={cn(
                                'absolute top-full size-0 border-x-4 border-t-4 border-x-transparent border-t-[#183d2c] dark:border-t-[#282c29]',
                                idx === 0
                                  ? 'left-4'
                                  : idx === chartBars.length - 1
                                  ? 'right-4'
                                  : 'left-1/2 -translate-x-1/2'
                              )}
                            />
                          </div>
                        )}

                        {/* Gradient Bar */}
                        <span
                          role="img"
                          aria-label={`${bar.dateStr}: ${formatCurrency(bar.amount)}`}
                          title={`${bar.dateStr}: ${formatCurrency(bar.amount)}`}
                          className={cn(
                            'agent-dashboard__bar block w-full rounded-t-lg transition-all duration-300',
                            bar.heightPct > 0
                              ? 'bg-gradient-to-t from-[#087343] to-[#38b376] group-hover:from-[#0a8950] group-hover:to-[#45cf8b]'
                              : 'h-1.5 bg-[#e0e9e0] dark:bg-[#2a302c] rounded-full'
                          )}
                          style={bar.heightPct > 0 ? { height: `${bar.heightPct}%` } : undefined}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* X-axis labels */}
              <div
                className="mt-2 grid gap-2 text-center text-[11px] font-medium text-[var(--text-muted)] sm:gap-4"
                style={{ gridTemplateColumns: `repeat(${chartBars.length}, minmax(0, 1fr))` }}
              >
                {chartBars.map((bar, idx) => (
                  <span key={idx} className="truncate">{bar.label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section
          aria-labelledby="actions-title"
          className="agent-dashboard__panel flex flex-col justify-between p-5 sm:p-6"
        >
          <div>
            <h2 id="actions-title" className="text-lg font-semibold tracking-tight sm:text-xl text-[var(--text-main)]">
              Quick actions
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <QuickActionCard
                href="/referrals"
                title="Referral links"
                subtitle="Share product journeys"
                icon={<ArrowUpRight className="size-5" />}
              />
              <QuickActionCard
                href="/sales"
                title="Sales"
                subtitle="Review performance"
                icon={<ClipboardList className="size-5" />}
              />
              <QuickActionCard
                title="Policies"
                subtitle="Browse your portfolio"
                icon={<FileText className="size-5" />}
                onClick={() => setPoliciesPreviewOpen(true)}
              />
              <QuickActionCard
                href="/commissions"
                title="Commissions"
                subtitle="Track earnings"
                icon={<CreditCard className="size-5" />}
              />
            </div>
          </div>
        </section>
      </div>

      {/* 4. Bottom Row: Pipeline Focus (Referral spotlight, wide/left) + Recent Activity (narrow/right) */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)] xl:gap-x-[18px] xl:gap-y-[14px]">
        {/* Keep Your Pipeline Moving (Referral Card spotlight) */}
        <section
          aria-labelledby="focus-title"
          className="agent-dashboard__focus relative overflow-hidden rounded-lg bg-[#075b38] p-6 text-white sm:p-7 min-w-0"
        >
          {/* Decorative Orbits */}
          <div className="agent-dashboard__focus-orbit pointer-events-none absolute -right-15 -top-12 size-52 rounded-full border border-white/15" />
          <div className="agent-dashboard__focus-orbit pointer-events-none absolute -right-6 top-16 size-52 rounded-full border border-white/15" />

          <h2
            id="focus-title"
            className="relative max-w-64 text-[24px] font-semibold leading-[30px] tracking-[-0.04em]"
          >
            Keep your pipeline moving.
          </h2>
          <p className="relative mt-3 max-w-72 text-[16px] leading-[24px] text-[#d7ecdb]">
            Review your saved work and share the right product journey with your clients.
          </p>

          <Link
            href="/referrals"
            className="relative mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-5 text-[16px] font-semibold text-[#006838] transition-colors hover:bg-[#e2eddb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Explore referral links
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </section>

        {/* Recent Activity Section */}
        <section
          id="activity"
          aria-labelledby="activity-title"
          className="agent-dashboard__panel min-w-0 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="activity-title" className="text-lg font-semibold tracking-tight sm:text-xl text-[var(--text-main)]">
                Recent activity
              </h2>
            </div>
            <Link
              href="/sales"
              className="text-xs font-semibold text-[#006838] hover:underline dark:text-[#d0e3c8]"
            >
              View all sales →
            </Link>
          </div>

          {/* Activity Search Input */}
          <label htmlFor="agent-activity-search" className="sr-only">
            Search recent activity
          </label>
          <input
            id="agent-activity-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity"
            className="ui-form-field mt-5 w-full"
          />

          {/* Activity List */}
          <div className="mt-4">
            {txLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            ) : filteredActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">
                {searchQuery
                  ? 'No activity matches your search.'
                  : 'No recent portfolio activity.'}
              </p>
            ) : (
              <ul className="divide-y divide-[#e8eee8] dark:divide-[#424a43]">
                {filteredActivity.slice(0, 3).map((tx) => {
                  const rawProduct = tx.product_name || tx.line_of_business || ''
                  const productName = rawProduct
                    ? rawProduct
                        .toLowerCase()
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : 'Insurance Policy'
                  const planName = tx.plan_name ? tx.plan_name.trim() : ''
                  const title = planName || productName
                  const paymentRef =
                    tx.merchant_transaction_id ||
                    tx.policy_number ||
                    tx.certificate_number ||
                    tx.proposal_number ||
                    `TX-${tx.id}`
                  let dateStr = 'Recent'
                  if (tx.created_at) {
                    try {
                      dateStr = format(parseISO(tx.created_at), 'MMM d, yyyy')
                    } catch {
                      dateStr = tx.created_at.split('T')[0] || 'Recent'
                    }
                  }
                  const amount = Number(tx.amount ?? 0)
                  const status =
                    (tx.status || '').toLowerCase() === 'completed' ||
                    (tx.transaction_status || '').toUpperCase() === 'PAID'
                      ? 'completed'
                      : tx.status ?? 'pending'

                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4ed] text-[#006838] dark:bg-[#3d5242] dark:text-[#d0e3c8]">
                        <FileText className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={`/sales/transactions/${tx.id ?? paymentRef}`}
                          className="block truncate text-[16px] font-semibold leading-6 text-[var(--text-main)] hover:text-[#006838] dark:hover:text-[#d0e3c8]"
                        >
                          {title}
                        </Link>
                        <small className="mt-0.5 block truncate text-[16px] leading-6 text-[var(--text-sub)]">
                          {paymentRef} · {dateStr}
                        </small>
                      </span>
                      <span className="text-right shrink-0">
                        <strong className="block text-[16px] font-semibold leading-6 text-[var(--text-main)]">
                          {formatCurrency(amount)}
                        </strong>
                        <span className="mt-0.5 block text-right">
                          <StatusLabel status={status} />
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
      </>
      )}
    </div>

      {/* Policies preview dialog — matches the mockup's action dialog */}
      <dialog
        ref={policiesDialogRef}
        aria-labelledby="policies-preview-title"
        onClose={() => setPoliciesPreviewOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPoliciesPreviewOpen(false)
        }}
        className="w-[min(430px,calc(100vw-2rem))] rounded-lg border border-[var(--border)] bg-white p-0 text-[var(--text-main)] shadow-2xl backdrop:bg-[#183d2c]/55 dark:border-[#3d4140] dark:bg-[var(--card)] dark:text-[var(--text-main)]"
      >
        {policiesPreviewOpen && (
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#006838] dark:text-[#d0e3c8]">
                  Agent portal preview
                </p>
                <h2
                  id="policies-preview-title"
                  className="mt-2 text-2xl font-semibold tracking-tight"
                >
                  Policies
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPoliciesPreviewOpen(false)}
                aria-label="Close preview"
                className="ui-action-icon -mr-2 -mt-2 text-xl"
              >
                ×
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--text-sub)]">
              Find completed coverage and certificate information.
            </p>
            <p className="mt-3 rounded-md bg-[#f1f2f0] p-4 text-sm leading-6 text-[#59645d] dark:bg-[#303232] dark:text-[var(--text-sub)]">
              A dedicated policies view with metrics, date filters and a policy
              table is coming soon.
            </p>
            <p className="mt-5 text-base leading-5 text-[var(--text-sub)]">
              This section is not yet available.
            </p>
            <button
              type="button"
              onClick={() => setPoliciesPreviewOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Back to dashboard
            </button>
          </div>
        )}
      </dialog>
    </>
  )
}
