'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { SearchInput } from '@/components/ui/search-input'
import { SelectField } from '@/components/ui/select-field'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill, TagPill } from '@/components/ui/status-pill'
import { DataTable } from '@/components/ui/data-table'
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import { downloadExport } from '@/lib/download-export'
import { extractApiError } from '@/lib/api-error'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { cn, formatPersonName } from '@/lib/utils'
import { tableMutedCls } from '@/lib/ui-classes'
import {
  formatAmount,
  txLineOfBusiness,
  txPaymentRef,
  txPremium,
  txProductName,
  txStatus,
  type Transaction,
} from '@/lib/transactions'
import type { ApiResponse, Paginated } from '@/types/admin/catalog'

const dash = (
  <span className="font-sans text-sm font-normal text-[var(--text-sub)]">
    —
  </span>
)

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

export function TransactionsClient() {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const dateFrom = dateRange?.from ?? ''
  const dateTo = dateRange?.to ?? ''

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const hasApplied = !!(searchDebounced || dateRange)

  const clearFilter = () => {
    setSearch('')
    setSearchDebounced('')
    setDateRange(null)
    setPage(1)
  }

  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isError, error } = useQuery<
    ApiResponse<Paginated<Transaction>>
  >({
    queryKey: ['admin-transactions', page, perPage, searchDebounced, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      })
      if (searchDebounced) params.set('search', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/transactions?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to load transactions'))
      }
      return res.json()
    },
    enabled,
  })

  const transactions = data?.data?.data ?? []
  const pagination = data?.data

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
        `/api/admin/transactions/export${query ? `?${query}` : ''}`,
        `transactions-${new Date().toISOString().split('T')[0]}.csv`
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
    <>
      <PortalContentHeader
        title="Transactions"
        description="Review policy transactions across agents."
      />
      <>
        <section className="mt-6" aria-label="Transactions">
          <TableHeader
            title="All transactions"
            count={pagination?.total ?? null}
            noun="transaction"
          />

          <div className="mt-5">
            <div className="portal-table-filters">
              <form
                role="search"
                aria-label="Filter transactions"
                className="portal-table-filters__form"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="portal-table-filters__date w-full">
                  <DateRangeField
                    id="transaction-range"
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
                    onChange={(v) => {
                      setSearch(v)
                    }}
                    placeholder="Policy, holder, product, insurer, agent..."
                  />
                </div>
                {hasApplied && (
                  <button
                    type="button"
                    onClick={clearFilter}
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
                      { id: 'csv', label: 'CSV', onSelect: handleExport },
                    ]}
                  />
                </div>
              </form>
            </div>
          </div>

          <DataTable<Transaction>
            className="mt-5"
            minWidth="min-w-[1050px]"
            bodyClassName="text-sm"
            columns={[
              {
                header: 'Policy no.',
                rowHeader: true,
                cell: (tx) => (
                  <span className="text-base text-[var(--text-main)]">
                    {tx.policy_number ?? dash}
                  </span>
                ),
              },
              {
                header: 'Policy holder',
                mobile: 'primary',
                cell: (tx) => (
                  <span className={tableMutedCls}>
                    {formatPersonName(tx.policy_holder ?? tx.customer_name) ||
                      dash}
                  </span>
                ),
              },
              {
                header: 'Product',
                cell: (tx) => {
                  const product = txProductName(tx)
                  const lob = txLineOfBusiness(tx)
                  if (!product && !lob) return dash
                  return (
                    <>
                      {product && (
                        <span className={cn('block', tableMutedCls)}>
                          {product}
                        </span>
                      )}
                      {lob && (
                        <span className="mt-1 block">
                          <TagPill>{lob}</TagPill>
                        </span>
                      )}
                    </>
                  )
                },
              },
              {
                header: 'Plan',
                cell: (tx) => (
                  <span className="font-medium text-[var(--text-main)]">
                    {tx.plan_name ?? tx.plan ?? dash}
                  </span>
                ),
              },
              {
                header: 'Premium',
                className: 'whitespace-nowrap tabular-nums',
                cell: (tx) => {
                  const premium = txPremium(tx)
                  return premium !== null ? (
                    <span className={tableMutedCls}>{formatAmount(premium)}</span>
                  ) : (
                    dash
                  )
                },
              },
              {
                header: 'Currency',
                cell: (tx) => (
                  <span className={tableMutedCls}>
                    {tx.currency || dash}
                  </span>
                ),
              },
              {
                header: 'Status',
                mobile: 'badge',
                cell: (tx) => <StatusPill status={txStatus(tx)} />,
              },
              {
                header: 'Created at',
                className: 'whitespace-nowrap',
                cell: (tx) => {
                  const created = formatCreatedAt(tx.created_at)
                  if (!created) return dash
                  return (
                    <span className="block">
                      <span className={cn('block', tableMutedCls)}>
                        {created.day}
                      </span>
                      {created.time && (
                        <span className={cn('mt-0.5 block text-xs', tableMutedCls)}>
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
                    href={`/transactions/${tx.id}`}
                    label={`View transaction ${txPaymentRef(tx) ?? tx.id} details`}
                    hint="View details"
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
                : 'Failed to load transactions. Please try again.'
            }
            emptyMessage={
              hasApplied
                ? 'No transactions match your filters.'
                : 'No records found.'
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
      </>
    </>
  )
}
