'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCheck2, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { DateRangeField, type DateRange } from '@/components/ui/date-range-field'
import { exportToCSV } from '@/lib/export-to-csv'
import { cn } from '@/lib/utils'
import {
  btnPrimaryCls,
  btnSecondaryCls,
  fieldCls,
  labelCls,
} from '@/lib/ui-classes'
import type {
  CommissionConfigPayload,
  LineOfBusiness,
  Paginated,
  Product,
  ProductPayload,
  Provider,
} from '@/types/admin/catalog'

const emptyForm = {
  name: '',
  description: '',
  carrier_product_code: '',
  provider_id: 0,
  lob_id: 0,
  status: 'active',
}

export function ProductsTab({ onCreateLob }: { onCreateLob: () => void }) {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)
  const dateFrom = dateRange?.from ?? ''
  const dateTo = dateRange?.to ?? ''
  const hasDateFilter = !!dateRange

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useQuery<Paginated<Product>>({
    queryKey: ['admin-products', page, perPage, searchDebounced, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      if (searchDebounced) params.set('keyword', searchDebounced)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await authFetch(`/api/admin/products?${params}`)
      if (!res.ok) throw new Error('Failed to load products')
      const json = await res.json()
      return (json?.data ?? json) as Paginated<Product>
    },
    enabled,
  })

  const { data: providers } = useQuery<Provider[]>({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const res = await authFetch('/api/admin/providers?page=1&per_page=100')
      if (!res.ok) throw new Error('Failed to load providers')
      const json = await res.json()
      return (json?.data?.data ?? json?.data ?? []) as Provider[]
    },
    enabled,
  })

  const { data: activeLobs, isLoading: lobsLoading } = useQuery<LineOfBusiness[]>({
    queryKey: ['admin-lobs', 'active-options'],
    queryFn: async () => {
      const res = await authFetch(
        '/api/admin/lobs?page=1&per_page=100&status=active'
      )
      if (!res.ok) throw new Error('Failed to load lines of business')
      const json = await res.json()
      return (json?.data?.data ?? []) as LineOfBusiness[]
    },
    enabled,
  })

  const products = data?.data ?? []
  const hasActiveLobs = (activeLobs ?? []).length > 0
  const noActiveLobs = !lobsLoading && activeLobs !== undefined && activeLobs.length === 0
  const noProducts = !isLoading && !isError && (data?.total ?? products.length) === 0

  // Client-side fallback if the upstream ignores date_from/date_to
  const filteredProducts = products.filter((p) => {
    if (!hasDateFilter) return true
    const day = (p.created_at ?? '').slice(0, 10)
    if (!day) return false
    if (dateFrom && day < dateFrom) return false
    if (dateTo && day > dateTo) return false
    return true
  })

  function openForm(product: Product | null) {
    setEditing(product)
    setForm(
      product
        ? {
            name: product.name,
            description: product.description,
            carrier_product_code: product.carrier_product_code ?? '',
            provider_id: product.provider_id,
            lob_id: product.lob_id ?? 0,
            status: product.status === 'inactive' ? 'inactive' : 'active',
          }
        : emptyForm
    )
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('Product name and description are required')
      return
    }
    if (!form.carrier_product_code.trim()) {
      toast.error('Carrier product code is required')
      return
    }
    if (!form.provider_id || !form.lob_id) {
      toast.error('Select a provider and a line of business')
      return
    }

    const payload: ProductPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      carrier_product_code: form.carrier_product_code.trim(),
      provider_id: form.provider_id,
      lob_id: form.lob_id,
      price: 0,
      status: form.status,
    }

    setSubmitting(true)
    try {
      const res = await authFetch(
        editing ? `/api/admin/products/${editing.id}` : '/api/admin/products',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message ?? 'Failed to save product')
      }

      if (!editing) {
        // Match admin-v1: create the default commission configuration
        const productId = Number(json?.data?.id)
        if (productId) {
          const commission: CommissionConfigPayload = {
            product_id: productId,
            base_commission: 30,
            agent_commission: 15,
            agent_overrider_commission: 10,
            agent_admin_commission: 15,
            agent_admin_overrider_commission: 10,
            referral_commission: 25,
            referral_overrider_commission: 5,
            referral_admin_commission: 10,
            referral_admin_overrider_commission: 5,
            vat: 12,
            witholding_tax: 10,
            gross_vat: 0,
            vatOptions: 'DEDUCT',
            effectivity_date: new Date().toISOString().split('T')[0],
            status: 'active',
          }
          const cRes = await authFetch(
            '/api/admin/commission-configurations',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(commission),
            }
          )
          if (!cRes.ok) {
            toast.warning(
              'Product created, but the default commission configuration failed. Configure it manually in Commissions.'
            )
          }
        }
      }

      toast.success(editing ? 'Product updated' : 'Product created')
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await authFetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete product')
      toast.success('Product deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  function handleExport() {
    if (filteredProducts.length === 0) {
      toast.info('No products to export')
      return
    }
    exportToCSV(
      filteredProducts.map((p) => ({
        name: p.name,
        carrier_product_code: p.carrier_product_code ?? '',
        provider: p.provider?.name ?? '',
        line_of_business: p.line_of_business?.name ?? '',
        status: p.status,
      })),
      `products-${new Date().toISOString().split('T')[0]}.csv`
    )
    toast.success(`Exported ${filteredProducts.length} product(s)`)
  }

  if (noActiveLobs && noProducts) {
    return (
      <div className="py-12 text-center sm:py-16">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e6f2e8] text-[#006838] dark:bg-[#38483b] dark:text-[#d0e3c8]">
          <FileCheck2 className="size-7" aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-semibold text-[var(--text-main)]">
          Create a line of business first
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-sub)]">
          Every product must belong to an active LoB. Add one to unlock product
          creation.
        </p>
        <button
          type="button"
          onClick={onCreateLob}
          className={btnPrimaryCls}
        >
          Create line of business
        </button>
      </div>
    )
  }

  return (
    <div>
      <TableHeader
        title="Insurance products"
        count={data?.total ?? null}
        noun="product"
      />

      <div className="mt-5">
        <div className="portal-table-filters">
          <form
            role="search"
            aria-label="Search products"
            className="portal-table-filters__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="portal-table-filters__date w-full">
              <DateRangeField
                id="product-range"
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
                placeholder="Search products"
              />
            </div>
            <div
              className="portal-table-filters__actions"
              role="group"
              aria-label="Table actions"
            >
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
              <ActionIcon
                label="New product"
                hint="New product"
                disabled={!hasActiveLobs}
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

      <DataTable<Product>
        className="mt-5"
        columns={[
          {
            header: 'Product',
            mobile: 'primary',
            cell: (product) => (
              <>
                <span className="block font-semibold text-[var(--text-main)]">
                  {product.name}
                </span>
                <span className="mt-0.5 block max-w-xs truncate text-sm text-[var(--text-sub)]">
                  {product.carrier_product_code ?? '—'}
                </span>
              </>
            ),
          },
          {
            header: 'Provider',
            cell: (product) => (
              <span className="text-[var(--text-sub)]">
                {product.provider?.name ?? '—'}
              </span>
            ),
          },
          {
            header: 'Line of business',
            cell: (product) => (
              <span className="text-[var(--text-sub)]">
                {product.line_of_business?.name ?? '—'}
              </span>
            ),
          },
          {
            header: 'Status',
            mobile: 'badge',
            cell: (product) => <StatusPill status={product.status} />,
          },
          {
            header: 'Action',
            mobile: 'action',
            cell: (product) => (
              <div className="flex items-center gap-1">
                <ActionIcon
                  label={`Edit ${product.name}`}
                  hint="Edit"
                  onClick={() => openForm(product)}
                >
                  <Pencil aria-hidden="true" />
                </ActionIcon>
                <ActionIcon
                  label={`Delete ${product.name}`}
                  hint="Delete"
                  failure
                  onClick={() => setDeleteTarget(product)}
                >
                  <Trash2 aria-hidden="true" />
                </ActionIcon>
              </div>
            ),
          },
        ]}
        rows={filteredProducts}
        getRowKey={(product) => product.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load products. Please try again."
        emptyMessage={
          searchDebounced || hasDateFilter || (data?.total ?? 0) > 0
            ? 'No products match your search.'
            : 'No products yet. Add the first one.'
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
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      )}

      {/* Create / edit product */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit product' : 'Create product'}
        className="max-w-xl"
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
              form="product-form"
              disabled={submitting || (!editing && !hasActiveLobs)}
              className={btnPrimaryCls}
            >
              {submitting
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Add product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>
              Product name <Required show={!editing} />
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
              Description <Required show={!editing} />
            </label>
            <textarea
              className={cn(fieldCls, 'min-h-24')}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>

          {/* Row: carrier code + provider */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Carrier product code <Required show={!editing} />
              </label>
              <input
                className={fieldCls}
                value={form.carrier_product_code}
                onChange={(e) =>
                  setForm({ ...form, carrier_product_code: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className={labelCls}>
                Provider <Required show={!editing} />
              </label>
              <SelectField
                value={form.provider_id}
                onChange={(e) =>
                  setForm({ ...form, provider_id: Number(e.target.value) })
                }
                required
              >
                <option value={0} disabled>
                  Choose a provider
                </option>
                {(providers ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>

          {/* Row: line of business + status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Line of business <Required show={!editing} />
              </label>
              <SelectField
                value={form.lob_id}
                onChange={(e) =>
                  setForm({ ...form, lob_id: Number(e.target.value) })
                }
                required
              >
                <option value={0} disabled>
                  Choose a line of business
                </option>
                {(activeLobs ?? []).map((lob) => (
                  <option key={lob.id} value={lob.id}>
                    {lob.name}
                  </option>
                ))}
              </SelectField>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Only active LoBs can be assigned.
              </p>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <SelectField
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>
            </div>
          </div>

          {!editing && (
            <p className="rounded-md bg-[#f1f2f0] p-4 text-sm leading-5 text-[var(--text-sub)] dark:bg-[#303232]">
              A default commission configuration will be created automatically.
              Adjust rates later in Commission setup.
            </p>
          )}
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        message={
          <>
            Remove <strong>{deleteTarget?.name}</strong> from the catalog? This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete product"
        loading={deleting}
        destructive
      />
    </div>
  )
}

function Required({ show }: { show: boolean }) {
  return show ? <span className="text-red-600">*</span> : null
}
