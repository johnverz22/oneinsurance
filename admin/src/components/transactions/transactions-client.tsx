'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { SearchInput } from '@/components/ui/search-input'
import { SelectField } from '@/components/ui/select-field'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill } from '@/components/ui/status-pill'
import { DataTable } from '@/components/ui/data-table'
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { exportToCSV } from '@/lib/export-to-csv'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { cn, formatPersonName } from '@/lib/utils'
import {
  btnPrimaryCls,
  fieldCls,
} from '@/lib/ui-classes'
import {
  formatAmount,
  txPaymentRef,
  txPremium,
  txProductType,
  txStatus,
  type Transaction,
} from '@/lib/transactions'
import type { ApiResponse, Paginated, Product } from '@/types/admin/catalog'

const dash = (
  <span className="font-sans text-sm font-normal text-[var(--text-sub)]">
    —
  </span>
)

const filterLabelCls =
  'mb-2 block text-sm font-medium text-[var(--text-main)]'

function searchBlob(tx: Transaction, productType: string | null): string {
  return [
    tx.policy_number,
    tx.certificate_number,
    tx.policy_holder,
    tx.customer_name,
    tx.plan_name,
    tx.plan,
    productType,
    tx.insurer_name,
    tx.merchant_transaction_id,
    tx.payment_id,
    tx.proposal_number,
    tx.agent_code_used,
    tx.agent?.name,
    tx.agent?.code,
    tx.status,
    tx.transaction_status,
    txStatus(tx),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function TransactionsClient() {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  // Draft inputs — committed by "Apply filter"
  const [searchDraft, setSearchDraft] = useState('')
  const [fromDraft, setFromDraft] = useState('')
  const [toDraft, setToDraft] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateError, setDateError] = useState(false)

  const hasApplied = !!(search || dateFrom || dateTo)

  const applyFilter = () => {
    if (fromDraft && toDraft && fromDraft > toDraft) {
      setDateError(true)
      return
    }
    setDateError(false)
    setSearch(searchDraft)
    setDateFrom(fromDraft)
    setDateTo(toDraft)
    setPage(1)
  }

  const clearFilter = () => {
    setSearchDraft('')
    setFromDraft('')
    setToDraft('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setDateError(false)
    setPage(1)
  }

  const { data, isLoading, isError } = useQuery<
    ApiResponse<Paginated<Transaction>>
  >({
    queryKey: ['admin-transactions', page, perPage, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/transactions?${params}`)
      if (!res.ok) throw new Error('Failed to load transactions')
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
    if (term && !searchBlob(tx, txProductType(tx, productByCode)).includes(term))
      return false
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

  function handleExport() {
    if (filtered.length === 0) {
      toast.info('No transactions to export')
      return
    }
    exportToCSV(
      filtered.map((tx) => ({
        policy_number: tx.policy_number ?? '',
        certificate_number: tx.certificate_number ?? '',
        policy_holder:
          formatPersonName(tx.policy_holder ?? tx.customer_name) || '',
        plan: tx.plan_name ?? tx.plan ?? '',
        product: txProductType(tx, productByCode) ?? '',
        premium: txPremium(tx) ?? '',
        currency: tx.currency ?? '',
        status: txStatus(tx),
        date: (tx.transaction_date ?? tx.created_at ?? '').slice(0, 10),
      })),
      `transactions-${new Date().toISOString().split('T')[0]}.csv`
    )
    toast.success(`Exported ${filtered.length} transaction(s)`)
  }

  return (
    <>
      <PortalContentHeader
        title="Transactions"
        description="Review policy transactions across agents."
      />
      <div className="mx-auto w-full max-w-7xl">
        <section className="mt-6" aria-label="Transactions">
          <TableHeader
            title="All transactions"
            titleClassName="text-xl"
            count={pagination?.total ?? null}
            noun="transaction"
          />

          <div className="mt-5">
            <div className="portal-table-filters">
              <form
                role="search"
                aria-label="Filter transactions"
                className="portal-table-filters__form"
                onSubmit={(e) => {
                  e.preventDefault()
                  applyFilter()
                }}
              >
                <div className="portal-table-filters__field w-full">
                  <label htmlFor="transaction-search" className={filterLabelCls}>
                    Search
                  </label>
                  <SearchInput
                    value={searchDraft}
                    onChange={setSearchDraft}
                    placeholder="Policy, holder, plan..."
                  />
                </div>
                <div className="portal-table-filters__field w-full">
                  <label htmlFor="transaction-from" className={filterLabelCls}>
                    From
                  </label>
                  <input
                    id="transaction-from"
                    type="date"
                    value={fromDraft}
                    max={toDraft || undefined}
                    onChange={(e) => setFromDraft(e.target.value)}
                    className={cn(fieldCls, 'mt-0')}
                  />
                </div>
                <div className="portal-table-filters__field w-full">
                  <label htmlFor="transaction-to" className={filterLabelCls}>
                    To
                  </label>
                  <input
                    id="transaction-to"
                    type="date"
                    value={toDraft}
                    min={fromDraft || undefined}
                    onChange={(e) => setToDraft(e.target.value)}
                    className={cn(fieldCls, 'mt-0')}
                  />
                </div>
                <div
                  className="portal-table-filters__actions"
                  role="group"
                  aria-label="Table actions"
                >
                  <button type="submit" className={btnPrimaryCls}>
                    Apply filter
                  </button>
                  {hasApplied && (
                    <button
                      type="button"
                      onClick={clearFilter}
                      className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-[#006838] transition-colors hover:bg-[#e6f2e8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:bg-[#303232]"
                    >
                      Clear
                    </button>
                  )}
                  <ExportMenu
                    items={[
                      { id: 'csv', label: 'CSV', onSelect: handleExport },
                    ]}
                  />
                </div>
              </form>
            </div>
          </div>
          {dateError && (
            <p
              role="alert"
              className="mt-3 text-sm font-medium text-[#b42318] dark:text-[#eba3a3]"
            >
              The From date must be on or before the To date.
            </p>
          )}

          <DataTable<Transaction>
            className="mt-5"
            minWidth="min-w-[1050px]"
            columns={[
              {
                header: 'Policy no.',
                rowHeader: true,
                cell: (tx) => (
                  <span className="text-xs font-medium text-[var(--text-main)]">
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
                header: 'Policy holder',
                mobile: 'primary',
                cell: (tx) => (
                  <span className="font-medium text-[var(--text-main)]">
                    {formatPersonName(tx.policy_holder ?? tx.customer_name) ||
                      dash}
                  </span>
                ),
              },
              {
                header: 'Plan',
                cell: (tx) => {
                  const product = txProductType(tx, productByCode)
                  return tx.plan_name || tx.plan ? (
                    <>
                      <span className="block font-medium text-[var(--text-main)]">
                        {tx.plan_name ?? tx.plan}
                      </span>
                      {product && (
                        <span className="mt-1 inline-flex rounded-md bg-[#eef4ee] px-2 py-0.5 text-xs text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]">
                          {product}
                        </span>
                      )}
                    </>
                  ) : product ? (
                    <span className="inline-flex rounded-md bg-[#eef4ee] px-2 py-0.5 text-xs text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]">
                      {product}
                    </span>
                  ) : (
                    dash
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
                cell: (tx) => <StatusPill status={txStatus(tx)} />,
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
            rows={filtered}
            getRowKey={(tx) => tx.id}
            isLoading={isLoading}
            isError={isError}
            errorMessage="Failed to load transactions. Please try again."
            emptyMessage={
              hasApplied
                ? 'No transactions match your filters.'
                : 'No records found.'
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
                htmlFor="transaction-rows"
                className="text-sm text-[var(--text-main)]"
              >
                Rows
              </label>
              <SelectField
                id="transaction-rows"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="mt-0 w-auto"
              >
                {[5, 10, 25, 50].map((n) => (
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
      </div>
    </>
  )
}
