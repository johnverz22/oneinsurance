'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthFetch } from '@/hooks/use-auth-fetch'
import { useHasHydrated, useIsAuthenticated } from '@/store/admin-auth-store'
import { SearchInput } from '@/components/ui/search-input'
import { SelectField } from '@/components/ui/select-field'
import { PaginationBar } from '@/components/ui/pagination-bar'
import { StatusPill } from '@/components/ui/status-pill'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { DataTable } from '@/components/ui/data-table'
import { ActionIcon } from '@/components/ui/action-icon'
import { ExportMenu } from '@/components/ui/export-menu'
import { TableHeader } from '@/components/ui/table-header'
import { exportToCSV } from '@/lib/export-to-csv'
import { cn, formatDate } from '@/lib/utils'
import {
  btnPrimaryCls,
  btnSecondaryCls,
  fieldCls,
  labelCls,
} from '@/lib/ui-classes'
import type {
  LineOfBusiness,
  LobPayload,
  Paginated,
} from '@/types/admin/catalog'

const emptyForm: LobPayload = {
  name: '',
  slug: '',
  description: '',
  status: 'active',
}

export function LobsTab() {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const hasDateFilter = !!(dateFrom || dateTo)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LineOfBusiness | null>(null)
  const [form, setForm] = useState<LobPayload>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LineOfBusiness | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useQuery<Paginated<LineOfBusiness>>({
    queryKey: ['admin-lobs', page, searchDebounced, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (searchDebounced) params.set('name', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/lobs?${params}`)
      if (!res.ok) throw new Error('Failed to load lines of business')
      const json = await res.json()
      return (json?.data ?? json) as Paginated<LineOfBusiness>
    },
    enabled,
  })

  const lobs = data?.data ?? []

  // Client-side fallback if the upstream ignores date_from/date_to
  const filteredLobs = lobs.filter((lob) => {
    if (!hasDateFilter) return true
    const day = (lob.created_at ?? '').slice(0, 10)
    if (!day) return false
    if (dateFrom && day < dateFrom) return false
    if (dateTo && day > dateTo) return false
    return true
  })

  function openForm(lob: LineOfBusiness | null) {
    setEditing(lob)
    setForm(
      lob
        ? {
            name: lob.name,
            slug: lob.slug ?? '',
            description: lob.description,
            status: lob.status === 'inactive' ? 'inactive' : 'active',
          }
        : emptyForm
    )
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await authFetch(
        editing ? `/api/admin/lobs/${editing.id}` : '/api/admin/lobs',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, name: form.name.trim(), slug: form.slug.trim() }),
        }
      )
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message ?? 'Failed to save line of business')
      }
      toast.success(editing ? 'Line of business updated' : 'Line of business created')
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-lobs'] })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save line of business'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await authFetch(`/api/admin/lobs/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete line of business')
      toast.success('Line of business deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-lobs'] })
    } catch {
      toast.error('Failed to delete line of business')
    } finally {
      setDeleting(false)
    }
  }

  function handleExport() {
    if (filteredLobs.length === 0) {
      toast.info('No lines of business to export')
      return
    }
    exportToCSV(
      filteredLobs.map((lob) => ({
        name: lob.name,
        slug: lob.slug ?? '',
        status: lob.status,
        created: formatDate(lob.created_at),
      })),
      `lines-of-business-${new Date().toISOString().split('T')[0]}.csv`
    )
    toast.success(`Exported ${filteredLobs.length} line(s) of business`)
  }

  return (
    <div>
      <TableHeader
        title="Lines of business"
        count={data?.total ?? null}
        noun="line of business"
        nounPlural="lines of business"
      />

      <div className="mt-5">
        <div className="portal-table-filters">
          <form
            role="search"
            aria-label="Search lines of business"
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
                placeholder="Search lines of business"
              />
            </div>
            <div className="portal-table-filters__field w-full">
              <label htmlFor="lob-date-from" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                From
              </label>
              <input
                id="lob-date-from"
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
            <div className="portal-table-filters__field w-full">
              <label htmlFor="lob-date-to" className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                To
              </label>
              <input
                id="lob-date-to"
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
            <div
              className="portal-table-filters__actions"
              role="group"
              aria-label="Table actions"
            >
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setPage(1)
                  }}
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-[#006838] transition-colors hover:bg-[#e6f2e8] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:bg-[#303232]"
                >
                  Clear
                </button>
              )}
              <ActionIcon
                label="New line of business"
                hint="New line of business"
                onClick={() => openForm(null)}
              >
                <Plus aria-hidden="true" />
              </ActionIcon>
              <ExportMenu
                items={[
                  { id: 'csv', label: 'CSV', onSelect: handleExport },
                ]}
              />
            </div>
          </form>
        </div>
      </div>

      <DataTable<LineOfBusiness>
        className="mt-5"
        columns={[
          {
            header: 'Name',
            mobile: 'primary',
            cell: (lob) => (
              <span className="font-semibold text-[var(--text-main)]">
                {lob.name}
              </span>
            ),
          },
          {
            header: 'Slug',
            cell: (lob) => (
              <span className="text-xs text-[var(--text-sub)]">
                {lob.slug || '—'}
              </span>
            ),
          },
          {
            header: 'Description',
            className: 'max-w-xs',
            cell: (lob) => (
              <p className="line-clamp-2 text-xs text-[var(--text-sub)]">
                {lob.description || '—'}
              </p>
            ),
          },
          {
            header: 'Status',
            mobile: 'badge',
            cell: (lob) => <StatusPill status={lob.status} />,
          },
          {
            header: 'Created',
            className: 'whitespace-nowrap',
            cell: (lob) => (
              <span className="text-xs whitespace-nowrap text-[var(--text-sub)]">
                {formatDate(lob.created_at)}
              </span>
            ),
          },
          {
            header: 'Actions',
            mobile: 'action',
            cell: (lob) => (
              <div className="flex items-center gap-1">
                <ActionIcon
                  label={`Edit ${lob.name}`}
                  hint="Edit"
                  onClick={() => openForm(lob)}
                >
                  <Pencil aria-hidden="true" />
                </ActionIcon>
                <ActionIcon
                  label={`Delete ${lob.name}`}
                  hint="Delete"
                  failure
                  onClick={() => setDeleteTarget(lob)}
                >
                  <Trash2 aria-hidden="true" />
                </ActionIcon>
              </div>
            ),
          },
        ]}
        rows={filteredLobs}
        getRowKey={(lob) => lob.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load lines of business. Please try again."
        emptyMessage={
          searchDebounced || hasDateFilter
            ? 'No lines of business match your filters.'
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

      {/* Create / edit LoB */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit line of business' : 'Create line of business'}
        description={
          editing
            ? 'Update this LoB.'
            : 'Products can be created after an active LoB is available.'
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
              className={btnSecondaryCls}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lob-form"
              disabled={submitting}
              className={btnPrimaryCls}
            >
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add LoB'}
            </button>
          </>
        }
      >
        <form id="lob-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>
              Name {!editing && <span className="text-red-600">*</span>}
            </label>
            <input
              className={fieldCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelCls}>
              Slug {!editing && <span className="text-red-600">*</span>}
            </label>
            <input
              className={fieldCls}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="e.g. travel-insurance"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Description (optional)</label>
            <textarea
              className={cn(fieldCls, 'min-h-24')}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <SelectField
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as 'active' | 'inactive',
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectField>
            <p className="mt-1 text-base text-[var(--text-muted)]">
              Only active LoBs can be assigned to new products.
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete line of business?"
        message={
          <>
            Remove <strong>{deleteTarget?.name}</strong>? Products already
            assigned to it will keep their association data.
          </>
        }
        confirmLabel="Delete LoB"
        loading={deleting}
        destructive
      />
    </div>
  )
}
