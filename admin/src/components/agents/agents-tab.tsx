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

  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null)
  const [activateTarget, setActivateTarget] = useState<Agent | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useQuery<AgentsResponse>({
    queryKey: ['admin-agents', page, searchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (searchDebounced) params.set('search', searchDebounced)
      const res = await authFetch(`/api/admin/agents?${params}`)
      if (!res.ok) throw new Error('Failed to load agents')
      return (await res.json()) as AgentsResponse
    },
    enabled,
  })

  const agents = data?.data?.data ?? []
  const pagination = data?.data

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
            <div className="portal-table-filters__field w-full">
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
                placeholder="Search agents"
              />
            </div>
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
            cell: (agent) => (
              <span className="font-mono text-xs font-normal text-[var(--text-main)]">
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
            header: 'Type',
            cell: (agent) => (
              <span className="text-[var(--text-sub)]">
                {agent.designation ?? agent.role ?? 'Agent'}
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
        rows={agents}
        getRowKey={(agent) => agent.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load agents. Please try again."
        emptyMessage={
          searchDebounced ? 'No agents match your search.' : 'No records found.'
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
