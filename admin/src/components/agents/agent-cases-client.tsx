'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
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
import { SummaryCardsSkeleton } from '@/components/ui/summary-card'
import { TransactionSummaryCards } from '@/components/transactions/transaction-summary-cards'
import { buildTransactionSummary } from '@/lib/transaction-summary'
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
                  className="btn-tertiary"
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

        {pagination && (
          <PaginationBar
            className="mt-5"
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            total={pagination.total}
            from={pagination.from ?? undefined}
            to={pagination.to ?? undefined}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(n) => {
              setPerPage(n)
              setPage(1)
            }}
          />
        )}
      </section>

      <CaseDetailDialog
        transactionId={selectedCaseId}
        onClose={() => setSelectedCaseId(null)}
      />
    </div>
  )
}

// ─── Case detail dialog ──────────────────────────────────────────────────────

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

  const summary = buildTransactionSummary(rawData, transactionId)
  const headerTitle =
    summary.policyNumber ?? (transactionId ? `Case #${transactionId}` : 'Case details')
  const status = summary.status

  return (
    <Modal
      open={transactionId !== null}
      onClose={onClose}
      title={headerTitle}
      headerRight={status ? <StatusPill status={status} /> : undefined}
      className="sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl"
    >
      {isLoading ? (
        <SummaryCardsSkeleton label="Loading case details" />
      ) : isError || !rawData ? (
        <p className="rounded-md border border-[#f1b8b3] bg-[#f8d9d6] p-4 text-sm text-[#991b1b] dark:border-[#991b1b]/50 dark:bg-[#991b1b]/20 dark:text-[#fecaca]">
          Unable to load case details.
        </p>
      ) : (
        <TransactionSummaryCards summary={summary} />
      )}
    </Modal>
  )
}
