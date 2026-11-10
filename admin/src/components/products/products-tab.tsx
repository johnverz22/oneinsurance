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
import { cn } from '@/lib/utils'
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
  ApiResponse,
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

export function ProductsTab() {
  const authFetch = useAuthFetch()
  const hasHydrated = useHasHydrated()
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const enabled = hasHydrated && isAuthenticated

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

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
    queryKey: ['admin-products', page, searchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '15' })
      if (searchDebounced) params.set('keyword', searchDebounced)
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

  const { data: activeLobs } = useQuery<LineOfBusiness[]>({
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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className={panelTitleCls}>Products</h3>
          <p className={panelDescCls}>
            Assign each product to an active line of business.
          </p>
          {!hasActiveLobs && !isLoading && (
            <p className="mt-1 text-sm font-medium text-[#92580a] dark:text-[#e4c27f]">
              Add an active line of business before creating products.
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!hasActiveLobs}
            title={
              hasActiveLobs ? undefined : 'Add an active line of business first'
            }
            onClick={() => openForm(null)}
            className={btnPrimaryCls}
          >
            <Plus className="size-4" aria-hidden="true" />
            New product
          </button>
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v)
                setPage(1)
              }}
              placeholder="Search products"
            />
          </div>
        </div>
      </div>

      <DataTable<Product>
        className="mt-4"
        columns={[
          {
            header: 'Product',
            mobile: 'primary',
            cell: (product) => (
              <>
                <span className="block font-semibold text-[var(--text-main)]">
                  {product.name}
                </span>
                <span className="mt-0.5 block max-w-xs truncate text-xs text-[var(--text-sub)]">
                  {product.carrier_product_code
                    ? `${product.carrier_product_code} · ${product.description}`
                    : product.description}
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
            cell: (product) =>
              product.line_of_business ? (
                <span className="inline-flex items-center rounded-full bg-[#eaf4e9] px-2.5 py-1 text-xs font-semibold text-[#006838] dark:bg-[#2d4433] dark:text-[#d0e3c8]">
                  {product.line_of_business.name}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)] italic">
                  No LoB assigned
                </span>
              ),
          },
          {
            header: 'Status',
            mobile: 'badge',
            cell: (product) => <StatusPill status={product.status} />,
          },
          {
            header: 'Actions',
            mobile: 'action',
            cell: (product) => (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openForm(product)}
                  title="Edit product"
                  className={iconActionCls}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(product)}
                  title="Delete product"
                  className={iconActionDangerCls}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ),
          },
        ]}
        rows={products}
        getRowKey={(product) => product.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load products. Please try again."
        emptyMessage={
          searchDebounced ? 'No products match your search.' : 'No records found.'
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

      {/* Create / edit product */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit product' : 'Create product'}
        description={
          editing
            ? 'Update this product.'
            : 'Add product details and assign an active line of business.'
        }
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
            <p className="rounded-md bg-[#f3f6f2] p-4 text-sm leading-5 text-[var(--text-sub)] dark:bg-[#303232]">
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
