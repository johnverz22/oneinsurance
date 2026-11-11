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
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import { exportToCSV } from '@/lib/export-to-csv'
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
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const dateFrom = dateRange?.from ?? ''
  const dateTo = dateRange?.to ?? ''
  const hasDateFilter = !!dateRange

  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null)
  const [activateTarget, setActivateTarget] = useState<Agent | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useQuery<AgentsResponse>({
    queryKey: ['admin-agents', page, searchDebounced, dateFrom, dateTo],
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
      const res = await authFetch(`/api/admin/agents?${params}`)
      if (!res.ok) throw new Error('Failed to load agents')
      return (await res.json()) as AgentsResponse
    },
    enabled,
  })

  const agents = data?.data?.data ?? []
  const pagination = data?.data

  // Client-side fallback if the upstream ignores date_from/date_to
  const filteredAgents = agents.filter((agent) => {
    if (!hasDateFilter) return true
    const day = (agent.created_at ?? '').slice(0, 10)
    if (!day) return false
    if (dateFrom && day < dateFrom) return false
    if (dateTo && day > dateTo) return false
    return true
  })

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

  function handleExport() {
    if (filteredAgents.length === 0) {
      toast.info('No agents to export')
      return
    }
    exportToCSV(
      filteredAgents.map((a) => ({
        agent_code: a.settings?.code ?? a.agent_code ?? '',
        name: agentDisplayName(a),
        type: a.role ?? a.designation ?? '',
        email: a.email,
        phone: a.phone ?? '',
        status: a.status,
      })),
      `agents-${new Date().toISOString().split('T')[0]}.csv`
    )
    toast.success(`Exported ${filteredAgents.length} agent(s)`)
  }

  return (
    <div>
      <TableHeader
        title="Agent management"
        titleClassName="text-xl"
        count={pagination?.total ?? null}
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
                items={[
                  { id: 'csv', label: 'CSV', onSelect: handleExport },
                ]}
              />
            </div>
          </form>
        </div>
      </div>

      <DataTable<Agent>
        className="mt-5"
        minWidth="min-w-[760px]"
        columns={[
          {
            header: 'Agent code',
            rowHeader: true,
            cell: (agent) => (
              <span className="text-sm font-normal text-[var(--text-main)]">
                {(agent.settings?.code ?? agent.agent_code ?? 'N/A').toUpperCase()}
              </span>
            ),
          },
          {
            header: 'Name',
            mobile: 'primary',
            cell: (agent) => (
              <span className="font-semibold text-[var(--text-main)]">
                {agentDisplayName(agent)}
              </span>
            ),
          },

          {
            header: 'Email',
            cell: (agent) => (
              <span className="text-[var(--text-sub)]">
                {agent.email || 'N/A'}
              </span>
            ),
          },
          {
            header: 'Phone',
            cell: (agent) => (
              <span className="text-[var(--text-sub)]">
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
        rows={filteredAgents}
        getRowKey={(agent) => agent.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load agents. Please try again."
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
