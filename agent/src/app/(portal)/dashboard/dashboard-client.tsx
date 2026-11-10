'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import {
  FileText,
  CreditCard,
  Coins,
  Search as SearchIcon,
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  Link2,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Clock,
  XCircle,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { subDays, format } from 'date-fns'
import { useAgentUser } from '@/store/agent-auth-store'
import { cn, formatCurrency, STOREFRONT_BASE_URL } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { usePortalSearchStore } from '@/store/portal-search-store'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import type { AgentStatistics, Transaction } from '@/types/agent/sales'

// ---- Chart period toggle ----
type Period = '7d' | '30d'

function buildDateParams(period: Period): { date_from: string; date_to: string } {
  const now = new Date()
  const date_to = format(now, 'yyyy-MM-dd')
  const date_from = format(subDays(now, period === '7d' ? 6 : 29), 'yyyy-MM-dd')
  return { date_from, date_to }
}

// ---- Quick-action item ----
type QuickActionProps = {
  href: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

function QuickActionCard({ href, title, subtitle, icon }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[116px] flex-col items-start justify-between rounded-md border border-[#e0e9e0] bg-[#fbfcfa] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#9cc7a7] hover:bg-[#f2f8f2] focus-visible:outline-2 focus-visible:outline-[#006838] dark:border-[#475049] dark:bg-[#171919] dark:hover:border-[#72a981] dark:hover:bg-[#202522]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#e6f2e8] text-[#006838] transition-colors group-hover:bg-[#006838] group-hover:text-white dark:bg-[#3d5242] dark:text-[#d0e3c8] dark:group-hover:bg-[#006838] dark:group-hover:text-white">
        {icon}
      </span>
      <div>
        <strong className="block text-base font-semibold leading-5 text-[var(--text-main)]">
          {title}
        </strong>
        <small className="mt-1 block text-sm leading-5 text-[var(--text-muted)]">
          {subtitle}
        </small>
      </div>
    </Link>
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
  const [copied, setCopied] = useState(false)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)

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

  // 4. Recent activity / transactions
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

  // Real chart data computed from backend daily_premiums and transactions
  const chartBars = useMemo(() => {
    const rawDaily = (trendData as Record<string, unknown> | undefined)
      ?.daily_premiums as Record<string, number | string> | undefined
    const now = new Date()

    if (period === '7d') {
      // 7 calendar days ending today: [now - 6d, now - 5d, ..., today]
      const days = Array.from({ length: 7 }).map((_, idx) => {
        const d = subDays(now, 6 - idx)
        const dateKey = format(d, 'yyyy-MM-dd')
        const dayLabel = format(d, 'EEE')[0]
        const dateStr = format(d, 'MMM d, yyyy')

        let amount = 0
        if (rawDaily && typeof rawDaily === 'object' && !Array.isArray(rawDaily) && dateKey in rawDaily) {
          amount = Number(rawDaily[dateKey]) || 0
        } else if (recentTx && recentTx.length > 0) {
          amount = recentTx
            .filter((tx) => {
              const txDate = tx.created_at ? tx.created_at.split('T')[0] : ''
              return txDate === dateKey
            })
            .reduce((sum, tx) => sum + Number(tx.amount ?? tx.premium ?? 0), 0)
        }

        return {
          label: dayLabel,
          dateStr,
          amount,
        }
      })

      const maxVal = Math.max(...days.map((d) => d.amount), 0)
      return days.map((d) => ({
        ...d,
        heightPct: maxVal > 0 && d.amount > 0 ? Math.max(10, Math.round((d.amount / maxVal) * 100)) : 0,
      }))
    } else {
      // 30 days: 7 discrete interval buckets covering the 30-day window
      const bucketSize = 4
      const buckets = Array.from({ length: 7 }).map((_, idx) => {
        const startDayOffset = 29 - idx * bucketSize
        const endDayOffset = Math.max(0, 29 - (idx + 1) * bucketSize + 1)
        const startDate = subDays(now, startDayOffset)
        const endDate = subDays(now, endDayOffset)
        const dateStr = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`

        let amount = 0
        if (rawDaily && typeof rawDaily === 'object' && !Array.isArray(rawDaily)) {
          Object.entries(rawDaily as Record<string, number>).forEach(([dKey, val]) => {
            const entryDate = new Date(dKey)
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

        const bucketLabel = String(idx * bucketSize + 1)
        return {
          label: bucketLabel,
          dateStr,
          amount,
        }
      })

      const maxVal = Math.max(...buckets.map((b) => b.amount), 0)
      return buckets.map((b) => ({
        ...b,
        heightPct: maxVal > 0 && b.amount > 0 ? Math.max(10, Math.round((b.amount / maxVal) * 100)) : 0,
      }))
    }
  }, [trendData, recentTx, period])

  // Referral link
  const agentCode = referralCodeData || user?.agent_code || 'agent'
  const referralUrl = `${STOREFRONT_BASE_URL}/${agentCode}`

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // Filter recent activity based on search query
  const filteredActivity = useMemo(() => {
    if (!recentTx) return []
    if (!searchQuery.trim()) return recentTx

    const q = searchQuery.toLowerCase().trim()
    return recentTx.filter((tx) => {
      const rawProduct =
        typeof tx.product === 'object' && tx.product !== null
          ? tx.product.name
          : tx.product_name ?? tx.product
      const productName = String(rawProduct || '')
      const planName = String(tx.plan_name ?? tx.plan ?? '')
      const paymentRef = String(
        tx.merchant_transaction_id ?? tx.payment_id ?? tx.policy_number ?? tx.id ?? ''
      )
      const status = String(tx.status ?? tx.payment_status ?? '')
      const amount = String(tx.amount ?? tx.premium ?? '')

      return (
        productName.toLowerCase().includes(q) ||
        planName.toLowerCase().includes(q) ||
        paymentRef.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q) ||
        amount.includes(q)
      )
    })
  }, [recentTx, searchQuery])

  return (
    <div className="space-y-6">
      {/* Page heading — the portal top bar's Quick search filters activity below */}
      <PortalContentHeader
        title="Dashboard"
        description="A clear view of your portfolio, progress, and next steps."
      />

      {/* 2. Portfolio Overview Metrics */}
      <section aria-labelledby="overview-title">
        <h2 id="overview-title" className="sr-only">
          Portfolio overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {/* Total Cases - Primary Highlight Card */}
          <article className="min-w-0 min-h-[174px] rounded-lg border border-[#006838] bg-gradient-to-br from-[#064b30] to-[#0b7e4b] p-4 text-white shadow-none sm:p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium leading-5">Total cases</h3>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <FileText className="size-5" />
              </span>
            </div>
            <div>
              <p className="text-[clamp(1.8rem,5vw,2.7rem)] font-semibold leading-none tracking-[-.06em]">
                {statsLoading ? '…' : totalCases}
              </p>
              <p className="mt-3 text-sm leading-5 opacity-75">Across your portfolio</p>
            </div>
          </article>

          {/* Total Premium */}
          <article className="min-w-0 min-h-[174px] rounded-lg border border-[#e0e9e0] bg-white p-4 shadow-none dark:border-[#3d4140] dark:bg-[#171919] sm:p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium leading-5 text-[var(--text-main)]">
                Total premium
              </h3>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                <CreditCard className="size-5" />
              </span>
            </div>
            <div>
              <p className="text-[clamp(1.8rem,5vw,2.7rem)] font-semibold leading-none tracking-[-.06em] text-[var(--text-main)]">
                {statsLoading ? '…' : formatCurrency(totalSales)}
              </p>
              <p className="mt-3 text-sm leading-5 text-[var(--text-sub)]">
                Gross premium collected
              </p>
            </div>
          </article>

          {/* Net Commissions */}
          <article className="min-w-0 min-h-[174px] rounded-lg border border-[#e0e9e0] bg-white p-4 shadow-none dark:border-[#3d4140] dark:bg-[#171919] sm:p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium leading-5 text-[var(--text-main)]">
                Net commissions
              </h3>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                <Coins className="size-5" />
              </span>
            </div>
            <div>
              <p className="text-[clamp(1.8rem,5vw,2.7rem)] font-semibold leading-none tracking-[-.06em] text-[var(--text-main)]">
                {statsLoading ? '…' : formatCurrency(netCommission)}
              </p>
              <p className="mt-3 text-sm leading-5 text-[var(--text-sub)]">
                Your earned commissions
              </p>
            </div>
          </article>

          {/* Products */}
          <article className="min-w-0 min-h-[174px] rounded-lg border border-[#e0e9e0] bg-white p-4 shadow-none dark:border-[#3d4140] dark:bg-[#171919] sm:p-5 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-medium leading-5 text-[var(--text-main)]">Products</h3>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eff6ef] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
                <ShoppingBag className="size-5" />
              </span>
            </div>
            <div>
              <p className="text-[clamp(1.8rem,5vw,2.7rem)] font-semibold leading-none tracking-[-.06em] text-[var(--text-main)]">
                {statsLoading ? '…' : productsCount}
              </p>
              <p className="mt-3 text-sm leading-5 text-[var(--text-sub)]">
                In your catalogue
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Middle Row: Premium Trend Chart + Quick Actions */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.8fr)]">
        {/* Premium Trend Panel */}
        <section
          aria-labelledby="trend-title"
          className="min-w-0 rounded-lg border border-[#e0e9e0] bg-white p-5 shadow-none dark:border-[#3d4140] dark:bg-[#171919] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="trend-title" className="text-lg font-semibold tracking-tight sm:text-xl text-[var(--text-main)]">
                Premium trend
              </h2>
            </div>
            <div
              className="flex rounded-md bg-[#eff4ef] p-1 dark:bg-[#353b36]"
              role="group"
              aria-label="Chart period"
            >
              <button
                type="button"
                onClick={() => setPeriod('7d')}
                aria-pressed={period === '7d'}
                className={cn(
                  'min-h-9 rounded-md px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#006838]',
                  period === '7d'
                    ? 'bg-white text-[#006838] shadow-sm dark:bg-[#1c1e1e] dark:text-[#d0e3c8]'
                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                )}
              >
                7 days
              </button>
              <button
                type="button"
                onClick={() => setPeriod('30d')}
                aria-pressed={period === '30d'}
                className={cn(
                  'min-h-9 rounded-md px-3 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#006838]',
                  period === '30d'
                    ? 'bg-white text-[#006838] shadow-sm dark:bg-[#1c1e1e] dark:text-[#d0e3c8]'
                    : 'text-[var(--text-sub)] hover:text-[var(--text-main)]'
                )}
              >
                30 days
              </button>
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between">
            <div>
              <p className="text-sm text-[var(--text-sub)]">Written premium</p>
              <p className="mt-1 text-3xl font-semibold tracking-[-.05em] text-[var(--text-main)]">
                {trendLoading ? '…' : formatCurrency(periodPremium)}
              </p>
            </div>
            <span className="rounded-md bg-[#e1f1e5] px-2.5 py-1 text-xs font-semibold text-[#006838] dark:bg-[#304535] dark:text-[#d0e3c8]">
              {period === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </span>
          </div>

          {/* Bar Chart using real data */}
          <div
            className="mt-7 grid h-44 grid-cols-7 items-end gap-2 border-b border-[#dce6dd] pb-2 dark:border-[#465049] sm:gap-4 relative"
            aria-label="Written premium bar chart"
          >
            {chartBars.map((bar, idx) => {
              const isPeak = idx === 1 || idx === 5
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
                    <div className="pointer-events-none absolute -top-12 z-20 whitespace-nowrap rounded-md bg-[#183d2c] px-2.5 py-1 text-xs font-semibold text-white shadow-lg dark:bg-[#282c29] dark:border dark:border-[#48524a]">
                      <p>{bar.dateStr}</p>
                      <p className="text-[#5fd488]">{formatCurrency(bar.amount)}</p>
                    </div>
                  )}

                  {/* Gradient Bar */}
                  <span
                    className={cn(
                      'block w-full rounded-t-lg transition-all duration-300',
                      bar.heightPct > 0
                        ? isPeak
                          ? 'bg-gradient-to-t from-[#064b30] to-[#0d6b40] group-hover:from-[#085a3a] group-hover:to-[#128a53]'
                          : 'bg-gradient-to-t from-[#087343] to-[#38b376] group-hover:from-[#0a8950] group-hover:to-[#45cf8b]'
                        : 'h-1.5 bg-[#e0e9e0] dark:bg-[#2a302c] rounded-full'
                    )}
                    style={bar.heightPct > 0 ? { height: `${bar.heightPct}%` } : undefined}
                  />
                </div>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-[var(--text-muted)] sm:gap-4">
            {chartBars.map((bar, idx) => (
              <span key={idx}>{bar.label}</span>
            ))}
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section
          aria-labelledby="actions-title"
          className="rounded-lg border border-[#e0e9e0] bg-white p-5 shadow-none dark:border-[#3d4140] dark:bg-[#171919] sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h2 id="actions-title" className="text-lg font-semibold tracking-tight sm:text-xl text-[var(--text-main)]">
              Quick actions
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <QuickActionCard
                href="/referrals"
                title="Referral links"
                subtitle="Share product journeys"
                icon={<ArrowUpRight className="size-5" />}
              />
              <QuickActionCard
                href="/sales"
                title="My sales"
                subtitle="Review performance"
                icon={<ShoppingBag className="size-5" />}
              />
              <QuickActionCard
                href="/sales"
                title="Policies"
                subtitle="Browse your portfolio"
                icon={<FileText className="size-5" />}
              />
              <QuickActionCard
                href="/settings"
                title="User settings"
                subtitle="Manage your profile"
                icon={<Settings className="size-5" />}
              />
            </div>
          </div>
        </section>
      </div>

      {/* 4. Bottom Row: Recent Activity + Pipeline Focus (Referral spotlight) */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.8fr)]">
        {/* Recent Activity Section */}
        <section
          id="activity"
          aria-labelledby="activity-title"
          className="min-w-0 rounded-lg border border-[#e0e9e0] bg-white p-5 shadow-none dark:border-[#3d4140] dark:bg-[#171919] sm:p-6"
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
          <div className="relative mt-5">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--text-muted)]" />
            <input
              id="agent-activity-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity by product, ref, or status"
              className="min-h-11 w-full rounded-md border border-[#dfe7df] bg-[#fbfcfa] pl-10 pr-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[#006838] focus:outline-none focus:ring-1 focus:ring-[#006838] dark:border-[#475049] dark:bg-[#303530] dark:text-[var(--text-main)] dark:placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Activity List */}
          <div className="mt-4">
            {txLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-lg" />
                ))}
              </div>
            ) : filteredActivity.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                {searchQuery
                  ? 'No activity matches your search.'
                  : 'No recent portfolio activity.'}
              </p>
            ) : (
              <ul className="divide-y divide-[#e8eee8] dark:divide-[#424a43]">
                {filteredActivity.slice(0, 6).map((tx) => {
                  const productName =
                    typeof tx.product === 'object' && tx.product !== null
                      ? tx.product.name
                      : tx.product_name ?? tx.product ?? 'Insurance Policy'
                  const title = tx.plan_name ?? tx.plan ?? productName
                  const paymentRef =
                    tx.merchant_transaction_id ??
                    tx.payment_id ??
                    tx.policy_number ??
                    `TX-${tx.id}`
                  const dateStr = tx.created_at ? tx.created_at.split('T')[0] : 'Recent'
                  const amount = Number(tx.amount ?? tx.premium ?? 0)
                  const status = tx.status ?? tx.payment_status ?? 'pending'

                  return (
                    <li key={tx.id}>
                      <Link
                        href={`/sales/transactions/${tx.id ? tx.id : paymentRef}`}
                        className="group flex items-center gap-3 py-3.5 transition-colors hover:bg-[var(--subtle)] rounded-lg px-2"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf4ed] text-[#006838] transition-colors group-hover:bg-[#006838] group-hover:text-white dark:bg-[#3d5242] dark:text-[#d0e3c8] dark:group-hover:bg-[#006838] dark:group-hover:text-white">
                          <FileText className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-sm font-semibold text-[var(--text-main)] group-hover:text-[#006838] dark:group-hover:text-[#d0e3c8]">
                            {title}
                          </strong>
                          <small className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                            {paymentRef} · {dateStr}
                          </small>
                        </span>
                        <span className="text-right shrink-0">
                          <strong className="block text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                            {formatCurrency(amount)}
                          </strong>
                          <span className="mt-0.5 block text-right">
                            <StatusLabel status={status} />
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Keep Your Pipeline Moving (Referral Card spotlight)
            Absolutely pinned on xl so its height is driven by the Recent
            activity card (the row's tallest item), never by its own content. */}
        <div className="relative min-w-0">
          <section
            aria-labelledby="focus-title"
            className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-[#075b38] p-6 text-white shadow-none sm:p-7 xl:absolute xl:inset-0 xl:overflow-y-auto"
          >
          {/* Decorative Orbits */}
          <div className="pointer-events-none absolute -right-16 -top-12 size-52 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -right-6 top-16 size-52 rounded-full border border-white/15" />

          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d7ecdb]">
              <ShieldCheck className="h-4 w-4" />
              Your Referral Link
            </div>

            <h2
              id="focus-title"
              className="mt-3 max-w-64 text-2xl font-semibold leading-tight tracking-[-.04em]"
            >
              Keep your pipeline moving.
            </h2>

            <p className="mt-3 max-w-72 text-sm leading-6 text-[#d7ecdb]">
              Review your saved work and share the right product journey with your clients to earn commissions.
            </p>

            {/* Direct referral box using real agent code */}
            <div className="mt-5 rounded-md bg-white/10 p-3 backdrop-blur-sm border border-white/20">
              <p className="text-[11px] font-medium text-[#d7ecdb] uppercase tracking-wider">
                Direct client URL
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <code className="truncate text-xs font-mono text-white select-all">
                  {referralUrl}
                </code>
                <button
                  type="button"
                  onClick={copyReferralLink}
                  aria-label="Copy referral link"
                  className="flex h-7 shrink-0 items-center gap-1 rounded bg-white px-2 text-xs font-semibold text-[#006838] transition-colors hover:bg-[#e2eddb]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-3 hidden rounded-md bg-white p-3 sm:flex sm:justify-center">
                <QRCodeSVG
                  value={referralUrl}
                  className="h-auto w-28"
                  aria-label={`QR code for ${referralUrl}`}
                />
              </div>
            </div>
          </div>

          <div className="relative mt-6 pt-2">
            <Link
              href="/referrals"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-[#006838] transition-colors hover:bg-[#e2eddb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore referral links
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          </section>
        </div>
      </div>
    </div>
  )
}
