'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { SearchInput } from '@/components/ui/search-input'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill } from '@/components/ui/status-pill'
import { ConfirmDialog } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import { exportToCSV } from '@/lib/export-to-csv'
import { downloadExport } from '@/lib/download-export'
import { extractApiError } from '@/lib/api-error'
import type { ReferralPartner, ReferralPartnersResponse } from '@/types/admin/people'

function partnerDisplayName(partner: ReferralPartner): string {
  if (partner.name) {
    return partner.name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  return (
    [partner.first_name, partner.last_name].filter(Boolean).join(' ') || 'N/A'
  )
}

export function ReferralPartnersTab() {
  const authFetch = useAuthFetch()
  const queryClient = useQueryClient()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const dateFrom = dateRange?.from ?? ''
  const dateTo = dateRange?.to ?? ''
  const hasDateFilter = !!dateRange

  const [deleteTarget, setDeleteTarget] = useState<ReferralPartner | null>(null)
  const [busy, setBusy] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const isSearching = !!searchDebounced

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    error: listErrorObj,
  } = useQuery<ReferralPartnersResponse>({
    queryKey: ['admin-referral-partners', 'list', page, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/referral-partners?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to load referral partners'))
      }
      return (await res.json()) as ReferralPartnersResponse
    },
    enabled: enabled && !isSearching,
  })

  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErrorObj,
  } = useQuery<ReferralPartnersResponse>({
    queryKey: ['admin-referral-partners', 'search', searchDebounced],
    queryFn: async () => {
      const res = await authFetch('/api/admin/referral-partners/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchDebounced }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to search referral partners'))
      }
      return (await res.json()) as ReferralPartnersResponse
    },
    enabled: enabled && isSearching,
  })

  const data = isSearching ? searchData : listData
  const isLoading = isSearching ? searchLoading : listLoading
  const isError = isSearching ? searchError : listError
  const error = isSearching ? searchErrorObj : listErrorObj

  const partners = data?.data?.data ?? []
  const pagination = isSearching ? undefined : data?.data

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['admin-referral-partners'] })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      const res = await authFetch(`/api/admin/referral-partners/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message ?? 'Failed to delete referral partner')
      toast.success(json?.message ?? 'Referral partner deleted')
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete referral partner')
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    if (isSearching) {
      if (partners.length === 0) {
        toast.info('No referral partners to export')
        return
      }
      exportToCSV(
        partners.map((p) => ({
          partner_code: p.settings?.code ?? p.agent_code ?? '',
          name: partnerDisplayName(p),
          email: p.email,
          phone: p.phone ?? '',
          status: p.status,
        })),
        `referral-partners-${new Date().toISOString().split('T')[0]}.csv`
      )
      toast.success(`Exported ${partners.length} referral partner(s)`)
      return
    }

    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const result = await downloadExport(
        authFetch,
        `/api/admin/referral-partners/export?${params}`,
        `referral-partners-${new Date().toISOString().split('T')[0]}.csv`
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
    <div>
      <TableHeader
        title="Referral partner management"
        titleClassName="text-xl"
        count={data?.data?.total ?? pagination?.total ?? null}
        noun="referral partner"
      />

      <div className="mt-5">
        <div className="portal-table-filters">
          <form
            role="search"
            aria-label="Search referral partners"
            className="portal-table-filters__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="portal-table-filters__date w-full">
              <DateRangeField
                id="referral-partners-range"
                value={dateRange}
                disabled={isSearching}
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
                  setPage(1)
                }}
                placeholder="Search referral partners"
              />
            </div>
            {(search || dateRange) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
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
                items={[{ id: 'csv', label: 'CSV', onSelect: handleExport }]}
              />
            </div>
          </form>
        </div>
        {isSearching && (
          <p className="mt-2 text-xs text-[var(--text-sub)]">
            Date range does not apply while searching.
          </p>
        )}
      </div>

      <DataTable<ReferralPartner>
        className="mt-5"
        minWidth="min-w-[700px]"
        columns={[
          {
            header: 'Partner code',
            rowHeader: true,
            cell: (partner) => (
              <span className="text-sm font-normal text-[var(--text-main)]">
                {(partner.settings?.code ?? partner.agent_code ?? 'N/A').toUpperCase()}
              </span>
            ),
          },
          {
            header: 'Name',
            mobile: 'primary',
            cell: (partner) => (
              <span className="font-semibold text-[var(--text-main)]">
                {partnerDisplayName(partner)}
              </span>
            ),
          },
          {
            header: 'Email',
            cell: (partner) => (
              <span className="text-[var(--text-sub)]">
                {partner.email || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Phone',
            cell: (partner) => (
              <span className="text-[var(--text-sub)]">
                {partner.phone || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Status',
            mobile: 'badge',
            cell: (partner) => <StatusPill status={partner.status} />,
          },
          {
            header: 'Actions',
            mobile: 'action',
            cell: (partner) => (
              <div className="flex items-center gap-1">
                <ActionIcon
                  href={`/agents/${partner.id}/profile`}
                  label={`View profile of ${partnerDisplayName(partner)}`}
                  hint="Profile"
                >
                  <UserRound aria-hidden="true" />
                </ActionIcon>
                <ActionIcon
                  label={`Delete ${partnerDisplayName(partner)}`}
                  hint="Delete"
                  failure
                  onClick={() => setDeleteTarget(partner)}
                >
                  <Trash2 aria-hidden="true" />
                </ActionIcon>
              </div>
            ),
          },
        ]}
        rows={partners}
        getRowKey={(partner) => partner.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error
            ? error.message
            : 'Failed to load referral partners. Please try again.'
        }
        emptyMessage={
          searchDebounced || hasDateFilter
            ? 'No referral partners match your search.'
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
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete referral partner?"
        message={
          <>
            Remove{' '}
            <strong>
              {deleteTarget ? partnerDisplayName(deleteTarget) : ''}
            </strong>{' '}
            ({deleteTarget?.email})? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={busy}
        destructive
      />
    </div>
  )
}
