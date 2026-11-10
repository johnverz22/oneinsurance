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
import { cn, formatDate } from '@/lib/utils'
import {
  btnPrimaryCls,
  btnSecondaryCls,
  fieldCls,
  iconActionCls,
  iconActionDangerCls,
  labelCls,
  panelDescCls,
  panelTitleCls,
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
    queryKey: ['admin-lobs', page, searchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      if (searchDebounced) params.set('name', searchDebounced)
      const res = await authFetch(`/api/admin/lobs?${params}`)
      if (!res.ok) throw new Error('Failed to load lines of business')
      const json = await res.json()
      return (json?.data ?? json) as Paginated<LineOfBusiness>
    },
    enabled,
  })

  const lobs = data?.data ?? []

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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className={panelTitleCls}>Lines of business</h3>
          <p className={panelDescCls}>
            Active LoBs can be assigned to new products.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => openForm(null)}
            className={btnPrimaryCls}
          >
            <Plus className="size-4" aria-hidden="true" />
            New LoB
          </button>
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v)
                setPage(1)
              }}
              placeholder="Search lines of business"
            />
          </div>
        </div>
      </div>

      <DataTable<LineOfBusiness>
        className="mt-4"
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
              <span className="font-mono text-xs text-[var(--text-sub)]">
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
                <button
                  type="button"
                  onClick={() => openForm(lob)}
                  title="Edit LoB"
                  className={iconActionCls}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(lob)}
                  title="Delete LoB"
                  className={iconActionDangerCls}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ),
          },
        ]}
        rows={lobs}
        getRowKey={(lob) => lob.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load lines of business. Please try again."
        emptyMessage={
          searchDebounced
            ? 'No lines of business match your search.'
            : 'No records found.'
        }
      />

      {data && (
        <PaginationBar
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
