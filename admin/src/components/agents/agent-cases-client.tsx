'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight, ChevronDown, CreditCard, Plus, ShieldCheck, Umbrella, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ActionIcon } from '@/components/ui/action-icon'
import { SearchInput } from '@/components/ui/search-input'
import { SelectField } from '@/components/ui/select-field'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill } from '@/components/ui/status-pill'
import { DataTable } from '@/components/ui/data-table'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import { downloadExport } from '@/lib/download-export'
import { extractApiError } from '@/lib/api-error'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { formatPersonName } from '@/lib/utils'
import {
  formatAmount,
  formatTxDate,
  txPaymentRef,
  txPremium,
  txProductName,
  type Transaction,
} from '@/lib/transactions'
import type { Agent } from '@/types/admin/people'
import type { ApiResponse, Paginated } from '@/types/admin/catalog'

const dash = (
  <span className="font-sans text-sm font-normal text-[var(--text-sub)]">
    —
  </span>
)

function agentDisplayName(agent?: Agent | null): string {
  if (!agent) return 'Agent'
  return (
    formatPersonName(
      agent.name ??
        [agent.first_name, agent.middle_name, agent.last_name]
          .filter(Boolean)
          .join(' ')
    ) || 'Agent'
  )
}

function agentType(agent?: Agent | null): string {
  if (!agent) return 'Agent'
  if (agent.designation) return formatPersonName(agent.designation)
  if (typeof agent.role === 'string' && agent.role.trim()) {
    return formatPersonName(agent.role)
  }
  return 'Agent'
}

function formatCreatedAt(raw?: string | null) {
  if (!raw) return null
  const hasTime = /[T ]\d{1,2}:\d{2}/.test(raw)
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return null
  return {
    day: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: hasTime
      ? date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : null,
  }
}

function netCommissionOf(tx: Transaction): number | null {
  const raw = tx.net_commission ?? tx.commission_log?.net_commission
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function paymentIdOf(tx: Transaction): string | null {
  return (
    tx.payment_id ??
    tx.merchant_transaction_id ??
    tx.proposal_number ??
    txPaymentRef(tx)
  )
}

function caseStatus(tx: Transaction): string {
  return tx.status ?? tx.transaction_status ?? 'pending'
}

export function AgentCasesClient({ agentId }: { agentId: number }) {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated && !!agentId

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const dateFrom = dateRange?.from ?? ''
  const dateTo = dateRange?.to ?? ''

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: agent } = useQuery<Agent>({
    queryKey: ['admin-agent-detail', agentId],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/agents/${agentId}`)
      if (!res.ok) throw new Error('Failed to load agent')
      const json = await res.json()
      return (json?.data ?? json) as Agent
    },
    enabled,
  })

  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isError, error } = useQuery<
    ApiResponse<Paginated<Transaction>>
  >({
    queryKey: [
      'admin-agent-transactions',
      agentId,
      page,
      perPage,
      searchDebounced,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      })
      if (searchDebounced) params.set('search', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(
        `/api/admin/agents/${agentId}/transactions?${params}`
      )
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to load cases'))
      }
      return res.json()
    },
    enabled,
  })

  const transactions = data?.data?.data ?? []
  const pagination = data?.data

  const agentName = agent ? agentDisplayName(agent) : `Agent #${agentId}`
  const agentCode = (
    agent?.settings?.code ??
    agent?.agent_code ??
    ''
  ).toUpperCase()
  const hasFilters = !!(searchDebounced || dateFrom || dateTo)

  async function handleExport() {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (searchDebounced) params.set('search', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const query = params.toString()
      const result = await downloadExport(
        authFetch,
        `/api/admin/agents/${agentId}/transactions/export${query ? `?${query}` : ''}`,
        `transactions-agent-${agentId}-${new Date().toISOString().split('T')[0]}.csv`
      )
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success('Export started')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div>
        <Link
          href="/agents?tab=agents"
          className="group mb-2 flex w-fit min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-[#006838] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="underline-offset-2 group-hover:underline group-focus-visible:underline">
            Back to agents
          </span>
        </Link>
        <div className="min-w-0">
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[var(--text-main)] sm:text-3xl">
            {agentName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-sub)] sm:text-base">
            Review case and transaction history for this partner.
          </p>
        </div>
        <p className="mt-1 text-sm text-[var(--text-sub)]">
          {agentType(agent)} · {agentCode || '—'}
        </p>
        <Link
          href={`/agents/${agentId}/profile`}
          className="inline-block rounded-md py-1 text-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8]"
        >
          View profile
        </Link>
      </div>

      <section className="mt-8" aria-label="Cases">
        <TableHeader
          title="Cases"
          titleClassName="text-xl"
          count={pagination?.total ?? null}
          noun="case"
        />

        <div className="mt-5">
          <div className="portal-table-filters">
            <form
              role="search"
              aria-label="Filter cases"
              className="portal-table-filters__form"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="portal-table-filters__date w-full">
                <DateRangeField
                  id="cases-range"
                  value={dateRange}
                  onApply={(range) => {
                    setDateRange(range)
                    setPage(1)
                  }}
                />
              </div>
              <div className="portal-table-filters__search w-full">
                <SearchInput
                  value={search}
                  onChange={(value) => {
                    setSearch(value)
                    setPage(1)
                  }}
                  placeholder="Search..."
                />
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setSearchDebounced('')
                    setDateRange(null)
                    setPage(1)
                  }}
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-[#006838] transition-colors hover:bg-[#e6f2e8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:bg-[#303232]"
                >
                  Clear
                </button>
              )}
              <div
                className="portal-table-filters__actions"
                role="group"
                aria-label="Table actions"
              >
                <ExportMenu
                  disabled={isExporting}
                  items={[
                    {
                      id: 'pdf',
                      label: 'PDF',
                      onSelect: () => window.print(),
                    },
                    { id: 'csv', label: 'CSV', onSelect: handleExport },
                  ]}
                />
              </div>
            </form>
          </div>
        </div>

        <DataTable<Transaction>
          className="mt-5"
          minWidth="min-w-[970px]"
          columns={[
            {
              header: 'Policy no.',
              rowHeader: true,
              cell: (tx) => (
                <span className="font-medium text-[var(--text-main)]">
                  {tx.policy_number ?? dash}
                </span>
              ),
            },
            {
              header: 'Certificate no.',
              cell: (tx) => (
                <span className="text-[var(--text-sub)]">
                  {tx.certificate_number ?? dash}
                </span>
              ),
            },
            {
              header: 'Payment ID',
              cell: (tx) => {
                const paymentId = paymentIdOf(tx)
                return (
                  <span className="font-medium text-[var(--text-sub)]">
                    {paymentId ?? dash}
                  </span>
                )
              },
            },
            {
              header: 'Plan',
              mobile: 'primary',
              cell: (tx) => {
                const plan = tx.plan_name ?? tx.plan
                const product = txProductName(tx)
                if (!plan && !product) return dash
                return (
                  <>
                    {plan && (
                      <span className="block font-medium text-[var(--text-main)]">
                        {plan}
                      </span>
                    )}
                    {product && (
                      <span className="block text-xs text-[var(--text-sub)]">
                        {product}
                      </span>
                    )}
                  </>
                )
              },
            },
            {
              header: 'Premium',
              className: 'whitespace-nowrap tabular-nums',
              cell: (tx) => {
                const premium = txPremium(tx)
                return premium !== null ? formatAmount(premium) : dash
              },
            },
            {
              header: 'Net commission',
              className: 'whitespace-nowrap tabular-nums',
              cell: (tx) => {
                const commission = netCommissionOf(tx)
                return commission !== null ? formatAmount(commission) : dash
              },
            },
            {
              header: 'Status',
              mobile: 'badge',
              cell: (tx) => <StatusPill status={caseStatus(tx)} />,
            },
            {
              header: 'Created at',
              className: 'whitespace-nowrap',
              cell: (tx) => {
                const created = formatCreatedAt(tx.created_at)
                if (!created) return dash
                return (
                  <span className="block">
                    <span className="block text-[var(--text-sub)]">
                      {created.day}
                    </span>
                    {created.time && (
                      <span className="mt-0.5 block text-xs text-[var(--text-sub)]">
                        {created.time}
                      </span>
                    )}
                  </span>
                )
              },
            },
            {
              header: 'Action',
              headerClassName: 'text-center',
              className: 'py-3 text-center',
              mobile: 'action',
              cell: (tx) => (
                <ActionIcon
                  label={`View case ${tx.policy_number ?? tx.id}`}
                  hint="View case"
                  onClick={() => setSelectedCaseId(tx.id)}
                >
                  <ArrowUpRight aria-hidden="true" />
                </ActionIcon>
              ),
            },
          ]}
          rows={transactions}
          getRowKey={(tx) => tx.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage={
            error instanceof Error
              ? error.message
              : 'Failed to load cases. Please try again.'
          }
          emptyMessage={
            hasFilters ? 'No cases match your filters.' : 'No cases found.'
          }
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm tabular-nums text-[var(--text-sub)]">
            {pagination && pagination.total > 0
              ? `Showing ${pagination.from ?? 0}–${pagination.to ?? 0} of ${pagination.total} results`
              : 'Showing 0 of 0 results'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="cases-rows"
              className="text-sm text-[var(--text-main)]"
            >
              Rows
            </label>
            <SelectField
              id="cases-rows"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              className="mt-0 w-auto"
            >
              {[10, 25].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
            {pagination && (
              <PaginationBar
                className="mt-0"
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>
      </section>

      <CaseDetailDialog
        transactionId={selectedCaseId}
        onClose={() => setSelectedCaseId(null)}
      />
    </div>
  )
}

// ─── Shared formatters ───────────────────────────────────────────────────────

function formatTimestamp(value?: string | null): string {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return value
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${day}, ${time}`
}

function formatDateOnly(value?: string | null): string {
  if (!value) return '—'
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateOnly) {
    return new Date(
      Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    ).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  if (isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTravelDates(start?: string | null, end?: string | null): string {
  if (!start && !end) return '—'
  const startLabel = start ? formatDateOnly(start) : null
  const endLabel = end ? formatDateOnly(end) : null
  const s = new Date(start ?? '')
  const e = new Date(end ?? '')
  let days: number | null = null
  if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
    days = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1
  }
  const range =
    startLabel && endLabel
      ? `${startLabel} – ${endLabel}`
      : (startLabel ?? `– ${endLabel}`)
  return days && days > 0 ? `${range} (${days} days)` : (range ?? '—')
}

function rawText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function firstText(...values: unknown[]): string {
  return rawText(...values) || '—'
}

function titleCase(value?: string | null): string {
  if (!value) return '—'
  return value
    .toString()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function countryName(code?: string | null): string {
  const value = rawText(code).toUpperCase()
  if (!value) return '—'
  if (value.length !== 2) return value
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value
  } catch {
    return value
  }
}

function personDisplayName(person: any): string {
  if (!person) return '—'
  const parts = [
    person.FirstName ?? person.first_name,
    person.MiddleName ?? person.middle_name,
    person.LastName ?? person.last_name,
  ].filter(Boolean)
  const name = parts.join(' ').trim()
  if (name) return name
  return firstText(
    person.InsuredName,
    person.CustomerName,
    person.name,
    [person.first_name, person.last_name].filter(Boolean).join(' ')
  )
}

function travellerTypeFromDob(dob?: string | null): string {
  if (!dob) return 'Adult'
  const time = new Date(dob).getTime()
  if (isNaN(time)) return 'Adult'
  return (Date.now() - time) / 31_557_600_000 >= 18 ? 'Adult' : 'Child'
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned || cleaned === '-' || cleaned === '.') return null
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}

function formatCurrency(value: unknown, currency?: string | null): string {
  const num = toFiniteNumber(value)
  if (num == null) return '—'
  const symbol = (currency ?? 'PHP') === 'PHP' ? '₱' : `${currency ?? 'PHP'} `
  return `${symbol}${num.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function formatLimitText(text: string): string {
  const grouped = (v: string) =>
    Number(v.replace(/,/g, '')).toLocaleString('en-PH', { maximumFractionDigits: 2 })
  return text
    .replace(
      /\b(?:PHP|Php)\s*(\d[\d,]*(?:\.\d+)?)/g,
      (_m, num: string) => `₱${grouped(num)}`
    )
    .replace(
      /(^|[^₱$€\d,])(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?)(?!\s*(?:%|\/|days?|hrs?|hours?))/g,
      (_m, prefix: string, num: string) => `${prefix}₱${grouped(num)}`
    )
}

function coverageLimitText(coverage: any): string {
  const limit = coverage?.limit
  let text = ''
  if (limit && typeof limit === 'object') {
    const notes = rawText(limit.notes)
    const amount = rawText(limit.amount, limit.sub_limit_amount)
    text = notes && notes !== '0' ? notes : amount || notes
  } else {
    text = rawText(limit, coverage?.CoverageLimit, coverage?.Limit)
  }
  if (!text) return 'Included'
  if (text === '0') return '—'
  if (/^\d+(\.\d+)?$/.test(text)) {
    const num = Number(text)
    if (num === 0) return '—'
    return `₱${num.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
  }
  return formatLimitText(text)
}

// ─── Coverage grouping ───────────────────────────────────────────────────────

function coverageCategory(coverage: any, name: string): string {
  const category = rawText(coverage?.category)
  if (category) return category
  if (/medical|emergency|hospital|dental|evacuation|treatment|transport/i.test(name))
    return 'Medical & emergency expenses'
  if (/trip|departure|connection|cancel|interrupt|document|accommodation|delay/i.test(name))
    return 'Trip disruption'
  if (/baggage|belongings|effects|item|property/i.test(name))
    return 'Personal belongings & baggage'
  return 'Other benefits'
}

function groupCoverages(coverages: any[]) {
  const groups = new Map<string, Array<{ name: string; limit: string }>>()
  const seen = new Set<string>()
  for (const coverage of coverages) {
    const name = rawText(coverage?.name, coverage?.CoverageName)
    if (!name) continue
    const category = coverageCategory(coverage, name)
    const key = `${category}|${name}`
    if (seen.has(key)) continue
    seen.add(key)
    const list = groups.get(category) ?? []
    list.push({ name, limit: coverageLimitText(coverage) })
    groups.set(category, list)
  }
  return Array.from(groups, ([name, items]) => ({ name, items }))
}

// ─── UI building blocks ──────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text-main)]">
      <header className="flex min-h-[87px] items-center gap-3 border-b border-[var(--border)] px-[21px] pb-[19px] pt-[22px]">
        <span
          aria-hidden="true"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-lg bg-[#006838] text-white"
        >
          <Icon className="size-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h3 className="text-[20px] font-semibold leading-6 text-[#006838] dark:text-[#d0e3c8]">
            {title}
          </h3>
          <p className="text-[14px] leading-[17px] text-[#878787] dark:text-[#b2b7b4]">
            {description}
          </p>
        </div>
        {badge && <div className="ms-auto shrink-0">{badge}</div>}
      </header>
      <div className="px-[29px] py-8">{children}</div>
    </section>
  )
}

function SummaryGroup({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h4 className="mb-4 text-xs font-normal uppercase text-[#b88e28] dark:text-[#e4c27f]">
        {title}
      </h4>
      {children}
    </section>
  )
}

function SummaryField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]">
        {label}
      </dt>
      <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
        {children}
      </dd>
    </div>
  )
}

function DialogSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading case details"
      className="space-y-5 motion-safe:animate-pulse"
    >
      <span className="sr-only">Loading case details…</span>
      {[3, 2, 1, 3, 2].map((rows, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="w-full min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]"
        >
          <div className="flex min-h-[87px] items-center gap-3 border-b border-[var(--border)] px-[21px] pb-[19px] pt-[22px]">
            <div className="size-[45px] shrink-0 rounded-lg bg-[var(--subtle)]" />
            <div className="min-w-0 space-y-2">
              <div className="h-5 w-40 rounded bg-[var(--subtle)]" />
              <div className="h-3 w-56 max-w-full rounded bg-[var(--subtle)]" />
            </div>
          </div>
          <div className="space-y-5 px-[29px] py-8">
            <div className="h-3 w-28 rounded bg-[var(--subtle)]" />
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: rows * 2 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--subtle)]" />
                  <div className="h-5 w-40 max-w-full rounded bg-[var(--subtle)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

function CaseDetailDialog({
  transactionId,
  onClose,
}: {
  transactionId: number | null
  onClose: () => void
}) {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled =
    hasHydrated && isAuthenticated && transactionId !== null && !!transactionId

  const { data: rawData, isLoading, isError } = useQuery<Transaction>({
    queryKey: ['admin-transaction', transactionId],
    queryFn: async () => {
      const res = await authFetch(`/api/admin/transactions/${transactionId}`)
      if (!res.ok) throw new Error('Failed to load case details')
      const json = await res.json()
      return (json?.data ?? json) as Transaction
    },
    enabled,
  })

  const tx: any = rawData ?? {}

  // ── Parse policy_details ──────────────────────────────────────────────────
  let policyDetails: any = null
  if (tx?.policy_details) {
    try {
      policyDetails =
        typeof tx.policy_details === 'string'
          ? JSON.parse(tx.policy_details)
          : tx.policy_details
    } catch {
      policyDetails = null
    }
  }

  const pd: any = policyDetails ?? {}

  const hasNewShape =
    Array.isArray(pd.coverages) ||
    Array.isArray(pd.travellers) ||
    !!pd.trip ||
    !!pd.insurer ||
    !!pd.plan

  // Legacy shapes
  const customers: any[] = pd.PolicyCustomerList ?? []
  const risks: any[] = pd.PolicyLobList?.[0]?.PolicyRiskList ?? []
  const travelDetails = pd.TravelDetailList?.[0] ?? null
  const legacyCoverages: any[] = []
  const seenLegacy = new Set<string>()
  for (const risk of risks) {
    for (const cov of risk?.PolicyCoverageList ?? []) {
      const name = cov?.CoverageName
      if (typeof name === 'string' && name && !seenLegacy.has(name)) {
        seenLegacy.add(name)
        legacyCoverages.push(cov)
      }
    }
  }

  // New shape arrays
  const pdTravellers: any[] = Array.isArray(pd.travellers) ? pd.travellers : []
  const pdCoverages: any[] = Array.isArray(pd.coverages) ? pd.coverages : []
  const pdTrip = pd.trip ?? null

  // ── Computed display values ───────────────────────────────────────────────

  const policyNumber =
    rawText(tx?.policy_number, tx?.carrier_policy_no, pd.policy_no, pd.CarrierPolicyNo) || null

  const proposalNumber =
    rawText(tx?.proposal_number, pd.proposal_number, pd.ProposalNo, pd.CarrierProposalNo) || null

  const certificateNumber =
    rawText(tx?.certificate_number, pd.certificate_number, pd.other_details?.prn_no) ||
    pdTravellers.map((t) => rawText(t?.certificate_number)).find(Boolean) ||
    null

  const plan = titleCase(
    firstText(pd.plan?.name, tx?.plan_name, pd.CarrierPlanCode, pd.PlanCode)
  )

  const product = titleCase(
    firstText(
      pd.product?.name,
      pd.ProductName,
      tx?.product_name,
      tx?.line_of_business,
      typeof tx?.product === 'object' ? tx?.product?.name : tx?.product
    )
  )

  const insurer = firstText(pd.insurer?.name, tx?.insurer_name)

  // Policy holder name
  const policyHolderCustomer =
    customers.find((c) => c.IsPolicyHolder === 'Y') ?? customers[0] ?? null
  const principalTraveller =
    pdTravellers.find((t) => t?.is_principal_applicant) ?? pdTravellers[0] ?? null
  const holderName =
    (hasNewShape
      ? [
          principalTraveller ? personDisplayName(principalTraveller) : '',
          rawText(tx?.policy_holder),
        ]
      : [
          policyHolderCustomer
            ? [
                policyHolderCustomer.FirstName,
                policyHolderCustomer.MiddleName,
                policyHolderCustomer.LastName,
              ]
                .filter(Boolean)
                .join(' ')
                .trim()
            : '',
          rawText(tx?.policy_holder),
        ]
    ).find((v) => v && v !== '—') ?? '—'

  // Contact from principal traveller or root tx fields
  const holderEmail = rawText(
    principalTraveller?.email,
    tx?.client_email
  )
  const holderPhone = rawText(
    principalTraveller?.mobile
      ? `+63${principalTraveller.mobile}`
      : '',
    tx?.client_phone
  )

  // Trip
  const originCode = rawText(pdTrip?.origin_country, travelDetails?.PlaceOfOrgin)
  const destCodes: string[] = Array.isArray(pdTrip?.destination_countries)
    ? pdTrip.destination_countries
    : travelDetails?.TravelCountry
      ? [travelDetails.TravelCountry]
      : []
  const origin = originCode ? countryName(originCode) : null
  const destination = destCodes.length
    ? destCodes.map((c: string) => countryName(c)).join(', ')
    : null
  const tripRoute =
    origin || destination
      ? `${origin ?? '—'} → ${destination ?? '—'}`
      : '—'
  const travelDates = formatTravelDates(
    pdTrip?.departure_date ?? pd.EffectiveDate,
    pdTrip?.return_date ?? pd.ExpiryDate
  )
  const travelType = titleCase(rawText(pdTrip?.trip_type, pd.TravelType))

  // Traveller rows
  const toCount = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
  }

  const travellers: Array<{
    name: string
    birthday: string
    gender: string
    type: string
    certificate: string | null
  }> =
    hasNewShape && pdTravellers.length > 0
      ? pdTravellers.map((t) => ({
          name: personDisplayName(t),
          birthday: formatDateOnly(t?.date_of_birth),
          gender: titleCase(t?.gender),
          type: travellerTypeFromDob(t?.date_of_birth),
          certificate: rawText(t?.certificate_number) || null,
        }))
      : risks.length > 0
        ? risks.map((r) => ({
            name: personDisplayName(r),
            birthday: formatDateOnly(r.DateOfBirth),
            gender: titleCase(r.Gender),
            type:
              String(r.IsAdultTraveller).toUpperCase() === 'N' ? 'Child' : 'Adult',
            certificate: null,
          }))
        : customers
            .filter((c) => String(c.IsInsured).toUpperCase() !== 'N')
            .map((c) => ({
              name: personDisplayName(c),
              birthday: formatDateOnly(c.DateOfBirth),
              gender: titleCase(c.Gender),
              type: c.IsPolicyHolder === 'Y' ? 'Policy holder' : 'Adult',
              certificate: null,
            }))

  const adultCount = travellers.filter((t) => t.type === 'Adult').length
  const childCount = travellers.filter((t) => t.type === 'Child').length
  const travellerCount =
    toCount(pdTrip?.traveler_count) || travellers.length || toCount(pd.NoOfTravellers)
  const travellerSummary =
    travellerCount > 0
      ? `${travellerCount} ${travellerCount === 1 ? 'traveller' : 'travellers'}` +
        (adultCount || childCount
          ? ` (${adultCount} adult${adultCount === 1 ? '' : 's'}${
              childCount ? `, ${childCount} child${childCount === 1 ? '' : 'ren'}` : ''
            })`
          : '')
      : '—'

  // Payment
  const referenceId = rawText(tx?.merchant_transaction_id, tx?.payment_id, String(tx?.id ?? transactionId ?? ''))
  const amount = tx?.amount ?? tx?.premium ?? pd.premium?.amount
  const method = rawText(tx?.payment_brand, tx?.payment_method) || '—'
  const currencyCode = rawText(tx?.currency, pd?.premium?.currency) || 'PHP'
  const rawNetCommission =
    tx?.net_commission ??
    tx?.commission_log?.net_commission ??
    tx?.commission_log?.agent_commission
  const rawStatus = rawText(tx?.transaction_status, tx?.payment_status, tx?.status) || 'pending'
  const timestamp = tx?.transaction_date ?? tx?.created_at ?? pd.issued_at ?? null
  const agentCode = (rawText(tx?.agent?.code, tx?.agent_code_used)).toUpperCase()
  const agentName = rawText(tx?.agent?.name) || null

  // Coverages
  const allCoverages = pdCoverages.length ? pdCoverages : legacyCoverages
  const coverageGroups = groupCoverages(
    allCoverages.filter(
      (c) =>
        c?.is_included !== false &&
        !rawText(c?.addon_code, c?.insurer_addon_code)
    )
  )

  const addonCoverages = pdCoverages.filter(
    (c) =>
      rawText(c?.addon_code, c?.insurer_addon_code) && c?.is_included !== false
  )
  const selectedAddonNames = pdTravellers
    .flatMap((t) => (Array.isArray(t?.selected_addons) ? t.selected_addons : []))
    .map((addon: any) =>
      rawText(
        typeof addon === 'string' ? addon : addon?.name,
        typeof addon === 'object' ? addon?.label : '',
        typeof addon === 'object' ? addon?.code : ''
      )
    )
    .filter(Boolean)
  const addonItems = [
    ...addonCoverages.map((c) => ({
      name: rawText(c?.name, c?.CoverageName),
      limit: coverageLimitText(c),
    })),
    ...selectedAddonNames.map((name: string) => ({ name, limit: 'Included' })),
  ].filter(
    (item, idx, list) =>
      item.name && list.findIndex((i) => i.name === item.name) === idx
  )

  // Header
  const headerTitle = policyNumber ?? (transactionId ? `Case #${transactionId}` : 'Case details')
  const status = rawText(tx?.status, tx?.transaction_status) || null

  return (
    <Modal
      open={transactionId !== null}
      onClose={onClose}
      title={headerTitle}
      headerRight={status ? <StatusPill status={status} /> : undefined}
      className="sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl"
    >
      {isLoading ? (
        <DialogSkeleton />
      ) : isError || !rawData ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Unable to load case details.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Policy overview */}
          <SummaryCard
            icon={ShieldCheck}
            title="Policy overview"
            description="Policy identifiers, cover and trip details."
          >
            <SummaryGroup
              title="Policy details"
              className="border-b border-[var(--border)] pb-6"
            >
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryField label="Plan">{plan}</SummaryField>
                <SummaryField label="Product">{product}</SummaryField>
                <SummaryField label="Insurer">{insurer}</SummaryField>
                <SummaryField label="Policy number">
                  <span className="break-all">{policyNumber ?? '—'}</span>
                </SummaryField>
                <SummaryField label="Proposal number">
                  <span className="break-all">{proposalNumber ?? '—'}</span>
                </SummaryField>
                <SummaryField label="Certificate number">
                  <span className="break-all">{certificateNumber ?? '—'}</span>
                </SummaryField>
                <SummaryField label="Policy holder">{holderName}</SummaryField>
              </dl>
            </SummaryGroup>

            {(origin || destination || travelDates !== '—' || travellerSummary !== '—') && (
              <SummaryGroup title="Trip details" className="mt-6">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryField label="Trip route">{tripRoute}</SummaryField>
                  <SummaryField label="Travel dates">{travelDates}</SummaryField>
                  <SummaryField label="Trip type">{travelType}</SummaryField>
                  <SummaryField label="Travellers">{travellerSummary}</SummaryField>
                </dl>
              </SummaryGroup>
            )}
          </SummaryCard>

          {/* Payment & commission */}
          <SummaryCard
            icon={CreditCard}
            title="Payment & commission"
            description="Payment records and commission earned on this policy."
          >
            <SummaryGroup
              title="Payment record"
              className="border-b border-[var(--border)] pb-6"
            >
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryField label="Reference ID">
                  <span className="break-all">{referenceId}</span>
                </SummaryField>
                <SummaryField label="Amount">
                  {formatCurrency(amount, currencyCode)}
                </SummaryField>
                <SummaryField label="Method">{method}</SummaryField>
                <SummaryField label="Status">{titleCase(rawStatus)}</SummaryField>
                <SummaryField label="Timestamp">{formatTimestamp(timestamp)}</SummaryField>
              </dl>
            </SummaryGroup>

            <SummaryGroup title="Commission" className="mt-6">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryField label="Net commission">
                  {formatCurrency(rawNetCommission, currencyCode)}
                </SummaryField>
                {agentName && (
                  <SummaryField label="Agent">{agentName}</SummaryField>
                )}
                {agentCode && (
                  <SummaryField label="Agent code">
                    <span className="break-all font-mono text-sm">{agentCode}</span>
                  </SummaryField>
                )}
              </dl>
            </SummaryGroup>
          </SummaryCard>

          {/* Travellers */}
          {travellers.length > 0 && (
            <SummaryCard
              icon={Users}
              title="Travellers"
              description="Insured travellers on this policy."
              badge={
                <StatusPill status={`${travellers.length} traveller${travellers.length === 1 ? '' : 's'}`} />
              }
            >
              <div
                role="table"
                aria-label="Insured travellers"
                className="overflow-x-auto"
              >
                <div role="rowgroup" className="min-w-[480px]">
                  <div
                    role="row"
                    className="grid grid-cols-5 gap-x-6 pb-3 text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]"
                  >
                    <div role="columnheader">#</div>
                    <div role="columnheader">Full name</div>
                    <div role="columnheader">Birthday</div>
                    <div role="columnheader">Gender</div>
                    <div role="columnheader">Type</div>
                  </div>
                </div>
                <div role="rowgroup" className="min-w-[480px]">
                  {travellers.map((t, idx) => (
                    <div
                      key={idx}
                      role="row"
                      className="grid grid-cols-5 gap-x-6 border-b border-[var(--border)] py-3 text-[16px] leading-6 last:border-b-0"
                    >
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {idx + 1}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.name}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.birthday}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.gender}
                      </div>
                      <div role="cell" className="min-w-0 [overflow-wrap:anywhere]">
                        {t.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SummaryCard>
          )}

          {/* Coverage summary */}
          {coverageGroups.length > 0 && (
            <SummaryCard
              icon={Umbrella}
              title="Coverage summary"
              description="Benefit limits grouped by type of cover."
              badge={
                <StatusPill
                  status={`${coverageGroups.length} benefit group${coverageGroups.length === 1 ? '' : 's'}`}
                />
              }
            >
              <div className="grid grid-cols-1">
                {coverageGroups.map((group) => (
                  <details
                    key={group.name}
                    className="travel-faq portal-coverage-group rounded-md"
                  >
                    <summary className="travel-faq__question flex min-h-16 cursor-pointer list-none items-center gap-3 px-3 py-5 text-xs font-normal uppercase text-[#b88e28] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#006838] dark:text-[#e4c27f]">
                      <span className="min-w-0 grow leading-6">{group.name}</span>
                      <span className="shrink-0 text-xs font-normal normal-case text-[var(--text-sub)]">
                        {group.items.length}{' '}
                        {group.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <ChevronDown
                        className="travel-faq__chevron size-5 shrink-0"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="portal-benefit-list overflow-hidden">
                      <dl className="grid">
                        {group.items.map((item, idx) => (
                          <div
                            key={`${item.name}-${idx}`}
                            className="grid min-w-0 items-start gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(130px,.6fr)] sm:gap-6"
                          >
                            <dt className="text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]">
                              {item.name}
                            </dt>
                            <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
                              {item.limit}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </details>
                ))}
              </div>
            </SummaryCard>
          )}

          {/* Add-ons */}
          {addonItems.length > 0 && (
            <SummaryCard
              icon={Plus}
              title="Add-ons"
              description="Additional cover included with this policy."
              badge={
                <StatusPill
                  status={`${addonItems.length} add-on${addonItems.length === 1 ? '' : 's'}`}
                />
              }
            >
              <SummaryGroup title="Additional benefits">
                <div className="portal-benefit-list overflow-hidden">
                  <dl className="grid">
                    {addonItems.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className="grid min-w-0 items-start gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(130px,.6fr)] sm:gap-6"
                      >
                        <dt className="text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]">
                          {item.name}
                        </dt>
                        <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
                          {item.limit}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </SummaryGroup>
            </SummaryCard>
          )}

          {/* Contact info (if not embedded in travellers) */}
          {!hasNewShape && (holderEmail || holderPhone) && (
            <SummaryCard
              icon={Users}
              title="Policy holder contact"
              description="Contact details for this policy."
            >
              <SummaryGroup title="Contact">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryField label="Name">{holderName}</SummaryField>
                  {holderEmail && (
                    <SummaryField label="Email">
                      <a
                        href={`mailto:${holderEmail}`}
                        className="text-[#006838] hover:underline dark:text-[#9fd4ae]"
                      >
                        {holderEmail}
                      </a>
                    </SummaryField>
                  )}
                  {holderPhone && (
                    <SummaryField label="Phone">
                      <a
                        href={`tel:${holderPhone.replace(/\s+/g, '')}`}
                        className="text-[#006838] hover:underline dark:text-[#9fd4ae]"
                      >
                        {holderPhone}
                      </a>
                    </SummaryField>
                  )}
                </dl>
              </SummaryGroup>
            </SummaryCard>
          )}
        </div>
      )}
    </Modal>
  )
}
