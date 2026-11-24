'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Coins,
  Search,
  Filter,
  Download,
  Calendar,
  CircleDollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { escapeCsvCell } from '@/lib/export-to-csv'
import type { AgentStatistics } from '@/types/agent/sales'

type CommissionLog = {
  id: number
  agent_id: number
  product_id?: number
  provider_id?: number
  transaction_id?: number
  policy_number?: string
  product_name?: string
  total_net_premium?: string | number
  commission_rate?: string | number
  gross_commission?: string | number
  net_commission?: string | number
  is_included_in_payout?: boolean
  payout_id?: number | null
  created_at: string
}

function MetricCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  hint?: string
}) {
  return (
    <div className="portal-page-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e2eddb] text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold text-[var(--text-main)]">{value}</p>
      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded" />
      ))}
    </div>
  )
}

export function CommissionsClient() {
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [payoutFilter, setPayoutFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const authFetch = useAuthFetch()

  // Overall statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AgentStatistics>({
    queryKey: ['agent-statistics'],
    queryFn: async () => {
      const res = await authFetch('/api/agent/statistics')
      if (!res.ok) throw new Error('Failed to load stats')
      const json = await res.json()
      return json.data || json
    },
  })

  // Commission logs query
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['commission-logs', search, fromDate, toDate, payoutFilter, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        date_from: fromDate,
        date_to: toDate,
        payout_status: payoutFilter,
        page: String(page),
        per_page: String(perPage),
      })
      const res = await authFetch(`/api/agent/commission-logs?${params}`)
      if (!res.ok) throw new Error('Failed to load commission logs')
      return res.json()
    },
  })

  const rawLogsData = logsData?.data
  const logs: CommissionLog[] = Array.isArray(rawLogsData)
    ? rawLogsData
    : Array.isArray(rawLogsData?.data)
      ? rawLogsData.data
      : []

  const meta = logsData?.meta || (rawLogsData && typeof rawLogsData === 'object' && 'total' in rawLogsData ? rawLogsData : null)

  const handleExportCSV = () => {
    if (!logs.length) return
    const headers = [
      'Log ID',
      'Policy Number',
      'Product',
      'Net Premium',
      'Commission Rate',
      'Gross Commission',
      'Net Commission',
      'Payout Status',
      'Date',
    ]

    const rows = logs.map((log) => [
      escapeCsvCell(log.id),
      escapeCsvCell(log.policy_number ?? 'N/A'),
      escapeCsvCell(log.product_name ?? 'N/A'),
      escapeCsvCell(log.total_net_premium ?? 0),
      escapeCsvCell(`${log.commission_rate ?? 0}%`),
      escapeCsvCell(log.gross_commission ?? 0),
      escapeCsvCell(log.net_commission ?? 0),
      escapeCsvCell(log.is_included_in_payout ? 'Paid' : 'Pending'),
      escapeCsvCell(log.created_at ? log.created_at.split('T')[0] : ''),
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `commission-logs-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PortalContentHeader
        title="Commissions"
        description="Review earnings, rates, and payout status across your portfolio."
      />

      {/* Metric cards */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Commission summary</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Net commissions"
            value={formatCurrency(Number(stats?.net_commissions ?? stats?.gross_commissions ?? 0))}
            icon={<Coins className="h-5 w-5" aria-hidden="true" />}
            hint="Total earned to date"
          />
          <MetricCard
            label="Gross premium"
            value={formatCurrency(Number(stats?.total_sales ?? stats?.total_premium ?? 0))}
            icon={<CircleDollarSign className="h-5 w-5" aria-hidden="true" />}
            hint="Portfolio production"
          />
          <MetricCard
            label="Total cases"
            value={Number(stats?.number_of_sales ?? stats?.total_cases ?? 0)}
            icon={<Briefcase className="h-5 w-5" aria-hidden="true" />}
            hint="Policies issued"
          />
          <MetricCard
            label="Active products"
            value={Number(stats?.number_of_products ?? stats?.products_count ?? 0)}
            icon={<Calendar className="h-5 w-5" aria-hidden="true" />}
            hint="Lines of business"
          />
        </div>
      </section>

      {/* Commission history table */}
      <div className="portal-page-card overflow-hidden p-0" aria-busy={logsLoading}>
        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-3 border-b border-[var(--border)] p-4 lg:p-6">
          <h2 className="w-full text-base font-semibold text-[var(--text-main)]">
            Commission logs
          </h2>

          {/* Search */}
          <div className="relative min-w-[180px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search policy, product…"
              aria-label="Search commission logs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="ui-form-field pl-9 text-sm"
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setPage(1)
              }}
              className="ui-form-field w-36 text-sm"
              aria-label="From date"
            />
            <span className="text-[var(--text-muted)]">–</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setPage(1)
              }}
              className="ui-form-field w-36 text-sm"
              aria-label="To date"
            />
          </div>

          {/* Payout status */}
          <select
            value={payoutFilter}
            onChange={(e) => {
              setPayoutFilter(e.target.value)
              setPage(1)
            }}
            className="ui-form-field w-36 text-sm"
            aria-label="Filter by payout status"
          >
            <option value="all">All payouts</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFromDate('')
              setToDate('')
              setPayoutFilter('all')
              setPage(1)
            }}
            className="btn-secondary min-h-[40px] px-4 text-sm"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="btn-secondary min-h-[40px] gap-2 px-4 text-sm disabled:opacity-40"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        {logsLoading ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Coins className="h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />
            <p className="text-sm text-[var(--text-muted)]">No commission logs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--subtle)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-4 py-3 lg:px-6">Log ID / Policy</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Net Premium</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Gross Commission</th>
                  <th className="px-4 py-3 text-right">Net Commission</th>
                  <th className="px-4 py-3">Payout Status</th>
                  <th className="px-4 py-3 lg:px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-[var(--subtle)]">
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-semibold text-[var(--text-main)]">
                          #{log.id}
                        </span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {log.policy_number ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--text-main)]">
                      {log.product_name ?? 'Insurance Product'}
                    </td>
                    <td className="px-4 py-4 text-right text-[var(--text-sub)]">
                      {formatCurrency(Number(log.total_net_premium || 0))}
                    </td>
                    <td className="px-4 py-4 text-right text-[var(--text-sub)]">
                      {log.commission_rate ? `${log.commission_rate}%` : '—'}
                    </td>
                    <td className="px-4 py-4 text-right text-[var(--text-sub)]">
                      {formatCurrency(Number(log.gross_commission || 0))}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-[#006838] dark:text-[#d0e3c8]">
                      {formatCurrency(Number(log.net_commission || 0))}
                    </td>
                    <td className="px-4 py-4">
                      {log.is_included_in_payout ? (
                        <span className="badge-success inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <span className="badge-pending inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--text-muted)] lg:px-6">
                      {log.created_at ? log.created_at.split('T')[0] : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
              <label htmlFor="per-page" className="text-xs text-[var(--text-muted)]">
                Rows per page
              </label>
              <select
                id="per-page"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="table-page-select"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary min-h-[32px] px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                {page} / {meta.last_page}
              </span>
              <button
                type="button"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary min-h-[32px] px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
