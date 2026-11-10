'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { SearchInput } from '@/components/ui/search-input'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill } from '@/components/ui/status-pill'
import { DataTable } from '@/components/ui/data-table'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { cn, formatPersonName } from '@/lib/utils'
import { txProductType } from '@/lib/transactions'
import {
  btnOutlineGreenCls,
  fieldCls,
  sectionTitleCls,
} from '@/lib/ui-classes'
import type { Agent } from '@/types/admin/people'
import type { ApiResponse, Paginated, Product } from '@/types/admin/catalog'

type Transaction = {
  id: number
  policy_number?: string | null
  proposal_number?: string | null
  certificate_number?: string | null
  merchant_transaction_id?: string | null
  policy_holder?: string | null
  customer_name?: string | null
  plan_name?: string | null
  product_name?: string | null
  carrier_product_code?: string | null
  insurer_name?: string | null
  premium?: string | number | null
  amount?: string | number | null
  paid_amount?: string | number | null
  currency?: string | null
  status?: string | null
  transaction_status?: string | null
  transaction_date?: string | null
  coverage_start?: string | null
  coverage_end?: string | null
  created_at?: string | null
  policy_details?: string | Record<string, unknown> | null
  product?: { name?: string | null } | null
}

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

function coveragePeriod(tx: Transaction): { label: string; days: number } | null {
  let effective: unknown = tx.coverage_start
  let expiry: unknown = tx.coverage_end
  if ((!effective || !expiry) && tx.policy_details) {
    try {
      const details =
        typeof tx.policy_details === 'string'
          ? JSON.parse(tx.policy_details)
          : tx.policy_details
      effective = effective || details?.EffectiveDate
      expiry = expiry || details?.ExpiryDate
    } catch {
      /* fall through to null check */
    }
  }
  if (!effective || !expiry) return null
  try {
    const start = new Date(effective as string)
    const end = new Date(expiry as string)
    const days =
      Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86400000) + 1
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    return { label: `${fmt(start)} - ${fmt(end)}`, days }
  } catch {
    return null
  }
}

export function AgentCasesClient({ agentId }: { agentId: number }) {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated && !!agentId

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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

  const { data, isLoading, isError } = useQuery<
    ApiResponse<Paginated<Transaction>>
  >({
    queryKey: ['admin-agent-transactions', agentId, page, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(
        `/api/admin/agents/${agentId}/transactions?${params}`
      )
      if (!res.ok) throw new Error('Failed to load cases')
      return res.json()
    },
    enabled,
  })

  const { data: catalog } = useQuery<Product[]>({
    queryKey: ['admin-products', 'transaction-lookup'],
    queryFn: async () => {
      const res = await authFetch('/api/admin/products?page=1&per_page=100')
      if (!res.ok) throw new Error('Failed to load products')
      const json = await res.json()
      return ((json?.data?.data ?? json?.data ?? []) as Product[]).filter(
        (p) => !p.deleted_at
      )
    },
    enabled,
  })

  const productByCode = new Map(
    (catalog ?? [])
      .filter((p) => p.carrier_product_code)
      .map((p) => [p.carrier_product_code as string, p])
  )

  const transactions = data?.data?.data ?? []
  const pagination = data?.data

  const term = search.trim().toLowerCase()
  const filtered = transactions.filter((tx) => {
    if (
      term &&
      ![
        tx.policy_number,
        tx.certificate_number,
        tx.policy_holder,
        tx.customer_name,
        tx.plan_name,
        txProductType(tx, productByCode),
      ].some((f) => f?.toLowerCase().includes(term))
    ) {
      return false
    }
    // Client-side fallback if the upstream ignores date_from/date_to
    if (dateFrom || dateTo) {
      const raw = tx.transaction_date ?? tx.created_at
      if (!raw) return false
      const day = raw.slice(0, 10)
      if (dateFrom && day < dateFrom) return false
      if (dateTo && day > dateTo) return false
    }
    return true
  })

  const agentName = agent ? agentDisplayName(agent) : `Agent #${agentId}`
  const agentCode = (
    agent?.settings?.code ??
    agent?.agent_code ??
    ''
  ).toUpperCase()

  return (
    <>
      <PortalContentHeader
        title="Agent cases"
        breadcrumbs={[
          { label: 'Agents', href: '/agents' },
          { label: agentName, href: `/agents/${agentId}/profile` },
          { label: 'Cases' },
        ]}
      />
      <div className="mx-auto w-full max-w-7xl">
        <section className="mt-4 min-w-0 rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/agents/${agentId}/profile`}
                className="text-xl font-semibold text-[var(--text-main)] underline-offset-2 hover:text-[#006838] hover:underline dark:hover:text-[#9fd4ae]"
              >
                {agentName}
              </Link>
              {agentCode ? (
                <p className="mt-1">
                  <code className="rounded-md bg-[#eff6ef] px-2 py-1 font-mono text-sm font-medium text-[#006838] dark:bg-[#2b352d] dark:text-[#9fd4ae]">
                    {agentCode}
                  </code>
                </p>
              ) : null}
            </div>
            <Link
              href={`/agents/${agentId}/profile`}
              className={btnOutlineGreenCls}
            >
              <UserRound className="size-4" aria-hidden="true" />
              View profile
            </Link>
          </div>
          <div className="mt-4">
            <h3 className={sectionTitleCls}>Policy transactions</h3>
            <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search policy, certificate, holder"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="cases-date-from"
                  className="mb-1 block text-xs font-medium text-[var(--text-sub)]"
                >
                  From
                </label>
                <input
                  id="cases-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className={cn(fieldCls, 'mt-0')}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="cases-date-to"
                  className="mb-1 block text-xs font-medium text-[var(--text-sub)]"
                >
                  To
                </label>
                <input
                  id="cases-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                  className={cn(fieldCls, 'mt-0')}
                />
              </div>
            </div>
          </div>

          <DataTable<Transaction>
            className="mt-4"
            minWidth="min-w-[960px]"
            columns={[
              {
                header: 'Policy no.',
                cell: (tx) => (
                  <span className="font-mono text-xs font-normal text-[var(--text-main)]">
                    {tx.policy_number ?? dash}
                  </span>
                ),
              },
              {
                header: 'Certificate no.',
                cell: (tx) => (
                  <span className="font-mono text-xs text-[var(--text-sub)]">
                    {tx.certificate_number ?? dash}
                  </span>
                ),
              },
              {
                header: 'Policy holder',
                mobile: 'primary',
                cell: (tx) => (
                  <span className="font-semibold text-[var(--text-main)]">
                    {formatPersonName(tx.policy_holder ?? tx.customer_name) ||
                      dash}
                  </span>
                ),
              },
              {
                header: 'Product',
                cell: (tx) => (
                  <span className="text-[var(--text-sub)]">
                    {txProductType(tx, productByCode) ?? dash}
                  </span>
                ),
              },
              {
                header: 'Plan',
                cell: (tx) => (
                  <span className="text-[var(--text-sub)]">
                    {tx.plan_name || dash}
                  </span>
                ),
              },
              {
                header: 'Coverage period',
                cell: (tx) => {
                  const period = coveragePeriod(tx)
                  return period ? (
                    <span className="text-[var(--text-sub)]">
                      <span className="block text-xs font-medium text-[var(--text-main)]">
                        {period.label}
                      </span>
                      <span className="text-xs">
                        {period.days} day{period.days !== 1 ? 's' : ''}
                      </span>
                    </span>
                  ) : (
                    dash
                  )
                },
              },
              {
                header: 'Premium',
                cell: (tx) =>
                  tx.premium ?? tx.paid_amount ?? tx.amount ? (
                    Number(
                      tx.premium ?? tx.paid_amount ?? tx.amount
                    ).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                  ) : (
                    dash
                  ),
              },
              {
                header: 'Currency',
                cell: (tx) => (
                  <span className="text-[var(--text-sub)]">
                    {tx.currency || dash}
                  </span>
                ),
              },
              {
                header: 'Status',
                mobile: 'badge',
                cell: (tx) => <StatusPill status={tx.status ?? 'pending'} />,
              },
            ]}
            rows={filtered}
            getRowKey={(tx) => tx.id}
            isLoading={isLoading}
            isError={isError}
            errorMessage="Failed to load cases. Please try again."
            emptyMessage={
              term || dateFrom || dateTo
                ? 'No cases match your filters.'
                : 'No records found.'
            }
          />

          {pagination && (
            <PaginationBar
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              total={pagination.total}
              from={pagination.from ?? undefined}
              to={pagination.to ?? undefined}
              onPageChange={setPage}
            />
          )}
        </section>
      </div>
    </>
  )
}
