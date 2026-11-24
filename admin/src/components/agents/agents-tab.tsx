'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase,
  Check,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { SearchInput } from '@/components/ui/search-input'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill } from '@/components/ui/status-pill'
import { ConfirmDialog } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { tableMutedCls } from '@/lib/ui-classes'
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import { exportToCSV } from '@/lib/export-to-csv'
import { downloadExport } from '@/lib/download-export'
import { extractApiError } from '@/lib/api-error'
import type { Agent, AgentsResponse } from '@/types/admin/people'

const SIGNUP_URL = `${process.env.NEXT_PUBLIC_AFFILIATE_BASE_URL ?? 'https://stage-agent.oneinsurance.shop'}/signup`

function agentDisplayName(agent: Agent): string {
  if (agent.name) {
    return agent.name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  return (
    [agent.first_name, agent.last_name].filter(Boolean).join(' ') || 'N/A'
  )
}

export function AgentsTab() {
  const authFetch = useAuthFetch()
  const queryClient = useQueryClient()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const dateFrom = dateRange?.from ?? ''
  const dateTo = dateRange?.to ?? ''
  const hasDateFilter = !!dateRange

  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null)
  const [activateTarget, setActivateTarget] = useState<Agent | null>(null)
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
  } = useQuery<AgentsResponse>({
    queryKey: ['admin-agents', 'list', page, perPage, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/agents?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to load agents'))
      }
      return (await res.json()) as AgentsResponse
    },
    enabled: enabled && !isSearching,
  })

  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErrorObj,
  } = useQuery<AgentsResponse>({
    queryKey: ['admin-agents', 'search', searchDebounced],
    queryFn: async () => {
      const res = await authFetch('/api/admin/agents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchDebounced }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(extractApiError(json, 'Failed to search agents'))
      }
      return (await res.json()) as AgentsResponse
    },
    enabled: enabled && isSearching,
  })

  const data = isSearching ? searchData : listData
  const isLoading = isSearching ? searchLoading : listLoading
  const isError = isSearching ? searchError : listError
  const error = isSearching ? searchErrorObj : listErrorObj

  const agents = data?.data?.data ?? []
  const pagination = isSearching ? undefined : data?.data

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['admin-agents'] })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      const res = await authFetch(`/api/admin/agents/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message ?? 'Failed to delete agent')
      toast.success(json?.message ?? 'Agent deleted')
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete agent')
    } finally {
      setBusy(false)
    }
  }

  async function handleActivate() {
    if (!activateTarget) return
    setBusy(true)
    try {
      const res = await authFetch('/api/auth/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activateTarget.id }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.message ?? 'Failed to activate agent')
      toast.success(json?.message ?? 'Agent activated')
      setActivateTarget(null)
      await refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to activate agent'
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSendSignupLink(agent: Agent) {
    try {
      const res = await authFetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agent.email,
          role: 'agent',
          invitation_url: SIGNUP_URL,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.message ?? 'Failed to send signup link')
      }
      toast.success(json?.message ?? `Signup link sent to ${agent.email}`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send signup link'
      )
    }
  }

  async function handleExport() {
    if (isSearching) {
      if (agents.length === 0) {
        toast.info('No agents to export')
        return
      }
      exportToCSV(
        agents.map((a) => ({
          agent_code: a.settings?.code ?? a.agent_code ?? '',
          name: agentDisplayName(a),
          type: a.role ?? a.designation ?? '',
          email: a.email,
          phone: a.phone ?? '',
          status: a.status,
        })),
        `agents-${new Date().toISOString().split('T')[0]}.csv`
      )
      toast.success(`Exported ${agents.length} agent(s)`)
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
        `/api/admin/agents/export?${params}`,
        `agents-${new Date().toISOString().split('T')[0]}.csv`
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
        title="Agent management"
        count={data?.data?.total ?? pagination?.total ?? null}
        noun="agent"
      />

      <div className="mt-5">
        <div className="portal-table-filters">
          <form
            role="search"
            aria-label="Search agents"
            className="portal-table-filters__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="portal-table-filters__date w-full">
              <DateRangeField
                id="agents-range"
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
                placeholder="Search agents"
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
        {isSearching && (
          <p className="mt-2 text-sm text-[var(--text-sub)]">
            Date range does not apply while searching.
          </p>
        )}
      </div>

      <DataTable<Agent>
        className="mt-5"
        minWidth="min-w-[760px]"
        bodyClassName="text-sm"
        columns={[
          {
            header: 'Agent code',
            rowHeader: true,
            cell: (agent) => (
              <span className={tableMutedCls}>
                {(agent.settings?.code ?? agent.agent_code ?? 'N/A').toUpperCase()}
              </span>
            ),
          },
          {
            header: 'Name',
            mobile: 'primary',
            cell: (agent) => (
              <span className="font-medium text-[var(--text-main)]">
                {agentDisplayName(agent)}
              </span>
            ),
          },

          {
            header: 'Email',
            cell: (agent) => (
              <span className={tableMutedCls}>
                {agent.email || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Phone',
            cell: (agent) => (
              <span className={tableMutedCls}>
                {agent.phone || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Status',
            mobile: 'badge',
            cell: (agent) => <StatusPill status={agent.status} />,
          },
          {
            header: 'Actions',
            mobile: 'action',
            cell: (agent) => {
              const status = agent.status?.toLowerCase()
              return (
                <div className="flex items-center gap-1">
                  <ActionIcon
                    href={`/agents/${agent.id}/cases`}
                    label={`View cases for ${agentDisplayName(agent)}`}
                    hint="Cases"
                  >
                    <Briefcase aria-hidden="true" />
                  </ActionIcon>
                  <ActionIcon
                    href={`/agents/${agent.id}/profile`}
                    label={`View profile of ${agentDisplayName(agent)}`}
                    hint="Profile"
                  >
                    <UserRound aria-hidden="true" />
                  </ActionIcon>
                  <ActionIcon
                    label={`Delete ${agentDisplayName(agent)}`}
                    hint="Delete"
                    failure
                    onClick={() => setDeleteTarget(agent)}
                  >
                    <Trash2 aria-hidden="true" />
                  </ActionIcon>
                  {status === 'inactive' && (
                    <ActionIcon
                      label={`Activate ${agentDisplayName(agent)}`}
                      hint="Activate"
                      onClick={() => setActivateTarget(agent)}
                    >
                      <Check aria-hidden="true" />
                    </ActionIcon>
                  )}
                  {(status === 'pending' || status === 'for interview') && (
                    <ActionIcon
                      label={`Resend signup link to ${agentDisplayName(agent)}`}
                      hint="Resend link"
                      onClick={() => handleSendSignupLink(agent)}
                    >
                      <Send aria-hidden="true" />
                    </ActionIcon>
                  )}
                </div>
              )
            },
          },
        ]}
        rows={agents}
        getRowKey={(agent) => agent.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error
            ? error.message
            : 'Failed to load agents. Please try again.'
        }
        emptyMessage={
          searchDebounced || hasDateFilter
            ? 'No agents match your search.'
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete agent?"
        message={
          <>
            Remove{' '}
            <strong>{deleteTarget ? agentDisplayName(deleteTarget) : ''}</strong>{' '}
            ({deleteTarget?.email})? This action cannot be undone.
          </>
        }
        confirmLabel="Delete agent"
        loading={busy}
        destructive
      />

      <ConfirmDialog
        open={!!activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={handleActivate}
        title="Activate agent?"
        message={
          <>
            Activate{' '}
            <strong>
              {activateTarget ? agentDisplayName(activateTarget) : ''}
            </strong>
            ? The agent will regain access to the portal.
          </>
        }
        confirmLabel="Activate"
        loading={busy}
      />
    </div>
  )
}
