'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, XCircle } from 'lucide-react'
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
import { downloadExport } from '@/lib/download-export'
import { extractApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/utils'
import {
  btnDangerCls,
  btnPrimaryCls,
} from '@/lib/ui-classes'
import type { Applicant } from '@/types/admin/people'
import type { Paginated as PaginatedType } from '@/types/admin/catalog'

const SIGNUP_URL = `${process.env.NEXT_PUBLIC_AFFILIATE_BASE_URL ?? 'https://stage-agent.oneinsurance.shop'}/signup`

function applicantName(a: Applicant) {
  return `${a.first_name} ${a.last_name}`.trim()
}

export function ApplicantsTab() {
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

  const [selected, setSelected] = useState<Applicant | null>(null)
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [busy, setBusy] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError, error } = useQuery<
    PaginatedType<Applicant>
  >({
    queryKey: ['admin-applicants', page, searchDebounced, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (searchDebounced) params.set('search', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/applicants?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to load applicants'))
      }
      const json = await res.json()
      return (json?.data ?? json) as PaginatedType<Applicant>
    },
    enabled,
  })

  const applicants = data?.data ?? []

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['admin-applicants'] })
  }

  async function handleConfirmDecision() {
    if (!selected || !decision) return
    setBusy(true)
    try {
      const res = await authFetch(`/api/admin/applicants/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision === 'approve' ? 'approved' : 'rejected',
          notes:
            decision === 'approve' ? 'Approved by admin' : 'Rejected by admin',
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message ?? `Failed to ${decision} applicant`)
      }

      if (decision === 'approve') {
        // Match admin-v1: send the agent signup invitation after approval
        const inviteRes = await authFetch('/api/admin/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: selected.email,
            role: 'agent',
            invitation_url: SIGNUP_URL,
          }),
        })
        if (!inviteRes.ok) {
          toast.warning(
            'Applicant approved, but the signup invitation failed to send.'
          )
        } else {
          toast.success(`Applicant approved — signup link sent to ${selected.email}`)
        }
      } else {
        toast.success('Applicant rejected')
      }

      setDecision(null)
      setSelected(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (searchDebounced) params.set('search', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const result = await downloadExport(
        authFetch,
        `/api/admin/applicants/export?${params}`,
        `applicants-${new Date().toISOString().split('T')[0]}.csv`
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

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected && !decision) {
    const isPending = selected.status?.toLowerCase() === 'pending'
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[#006838] transition-colors hover:underline dark:text-[#9fd4ae]"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Back to agents
        </button>

        <div className="rounded-md border border-[#dfe7df] p-5 dark:border-[#3d4140]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-main)]">
                {applicantName(selected)}
              </h3>
              <p className="text-sm text-[var(--text-sub)]">
                APP{String(selected.id).padStart(3, '0')} ·{' '}
                {selected.application_type || 'Agent application'}
              </p>
            </div>
            <StatusPill status={selected.status} />
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--text-sub)]">Email</dt>
              <dd className="font-medium break-all text-[var(--text-main)]">
                {selected.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-sub)]">
                Phone number
              </dt>
              <dd className="font-medium text-[var(--text-main)]">
                {selected.contact_number || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-sub)]">
                Applied
              </dt>
              <dd className="font-medium text-[var(--text-main)]">
                {formatDate(selected.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-sub)]">Notes</dt>
              <dd className="font-medium text-[var(--text-main)]">
                {selected.notes || '—'}
              </dd>
            </div>
          </dl>

          {isPending && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#dfe7df] pt-4 dark:border-[#3d4140]">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className={btnPrimaryCls}
              >
                <Check className="size-4" aria-hidden="true" />
                Approve & send link
              </button>
              <button
                type="button"
                onClick={() => setDecision('reject')}
                className={btnDangerCls}
              >
                <XCircle className="size-4" aria-hidden="true" />
                Reject
              </button>
            </div>
          )}
        </div>

        <DecisionModals
          selected={selected}
          decision={decision}
          busy={busy}
          onClose={() => setDecision(null)}
          onConfirm={handleConfirmDecision}
        />
      </div>
    )
  }

  // ── Table view ───────────────────────────────────────────────────────────
  return (
    <div>
      <TableHeader
        title="Applicant management"
        titleClassName="text-xl"
        count={data?.total ?? null}
        noun="applicant"
      />

      <div className="mt-5">
        <div className="portal-table-filters">
          <form
            role="search"
            aria-label="Search applicants"
            className="portal-table-filters__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="portal-table-filters__date w-full">
              <DateRangeField
                id="applicants-range"
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
                  setPage(1)
                }}
                placeholder="Search applicants"
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
                items={[
                  { id: 'csv', label: 'CSV', onSelect: handleExport },
                ]}
              />
            </div>
          </form>
        </div>
      </div>

      <DataTable<Applicant>
        className="mt-5"
        minWidth="min-w-[860px]"
        onRowClick={setSelected}
        columns={[
          {
            header: 'ID',
            rowHeader: true,
            cell: (applicant) => (
              <span className="text-sm font-normal text-[var(--text-main)]">
                APP{String(applicant.id).padStart(3, '0')}
              </span>
            ),
          },
          {
            header: 'Name',
            mobile: 'primary',
            cell: (applicant) => (
              <span className="font-semibold text-[var(--text-main)]">
                {applicantName(applicant)}
              </span>
            ),
          },
          {
            header: 'Type',
            cell: (applicant) => (
              <span className="text-[var(--text-sub)] capitalize">
                {applicant.application_type || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Email',
            cell: (applicant) => (
              <span className="text-[var(--text-sub)]">
                {applicant.email}
              </span>
            ),
          },
          {
            header: 'Phone',
            cell: (applicant) => (
              <span className="text-[var(--text-sub)]">
                {applicant.contact_number || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Status',
            mobile: 'badge',
            cell: (applicant) => <StatusPill status={applicant.status} />,
          },
          {
            header: 'Actions',
            mobile: 'action',
            cell: (applicant) =>
              applicant.status?.toLowerCase() === 'pending' ? (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionIcon
                    label={`Approve ${applicantName(applicant)}`}
                    hint="Approve"
                    onClick={() => {
                      setSelected(applicant)
                      setDecision('approve')
                    }}
                  >
                    <Check aria-hidden="true" />
                  </ActionIcon>
                  <ActionIcon
                    label={`Reject ${applicantName(applicant)}`}
                    hint="Reject"
                    failure
                    onClick={() => {
                      setSelected(applicant)
                      setDecision('reject')
                    }}
                  >
                    <XCircle aria-hidden="true" />
                  </ActionIcon>
                </div>
              ) : null,
          },
        ]}
        rows={applicants}
        getRowKey={(applicant) => applicant.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error
            ? error.message
            : 'Failed to load applicants. Please try again.'
        }
        emptyMessage={
          searchDebounced || hasDateFilter
            ? 'No applicants match your search.'
            : 'No records found.'
        }
      />

      {data && (
        <PaginationBar
          className="mt-5"
          currentPage={data.current_page}
          lastPage={data.last_page}
          total={data.total}
          from={data.from ?? undefined}
          to={data.to ?? undefined}
          onPageChange={setPage}
        />
      )}

      <DecisionModals
        selected={selected}
        decision={decision}
        busy={busy}
        onClose={() => setDecision(null)}
        onConfirm={handleConfirmDecision}
      />
    </div>
  )
}

function DecisionModals({
  selected,
  decision,
  busy,
  onClose,
  onConfirm,
}: {
  selected: Applicant | null
  decision: 'approve' | 'reject' | null
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <ConfirmDialog
        open={decision === 'approve'}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Approve applicant"
        message={
          <>
            Approve <strong>{selected ? applicantName(selected) : ''}</strong>?
            A signup link will be sent to {selected?.email}.
          </>
        }
        confirmLabel="Approve & send link"
        loading={busy}
      />
      <ConfirmDialog
        open={decision === 'reject'}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Reject applicant"
        message={
          <>
            Reject <strong>{selected ? applicantName(selected) : ''}</strong>?
            This can be reversed later if needed.
          </>
        }
        confirmLabel="Reject"
        loading={busy}
        destructive
      />
    </>
  )
}
