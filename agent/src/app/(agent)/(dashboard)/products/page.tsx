'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Product } from '@/types/agent/product'
import { useGetAgentLOBProducts } from '@/app/data/queries/agent-lob-products'
import { useMemo } from 'react'

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Product Name',
    cell: ({ row }) => (
      <span className="font-semibold text-gray-900">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-gray-500 line-clamp-2">{row.original.description || '—'}</span>
    ),
  },
  {
    accessorKey: 'providerName',
    header: 'Provider',
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">{row.original.providerName || '—'}</span>
    ),
  },
  {
    accessorKey: 'lobName',
    header: 'Line of Business',
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        {row.original.lobName || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.original.status?.toLowerCase() === 'active'
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          active ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
        }`}>
          {row.original.status}
        </span>
      )
    },
  },
  {
    accessorKey: 'agentCommission',
    header: 'Agent Commission',
    cell: ({ row }) => {
      const val = row.original.agentCommission
      if (val == null) return <span className="text-xs text-gray-400">—</span>
      return (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {parseFloat(val).toFixed(2)}%
        </span>
      )
    },
  },
]

const MyProductsPage = () => {
  const { data: lobProducts, isLoading } = useGetAgentLOBProducts()

  const products = useMemo(() => {
    if (!lobProducts) return []
    return lobProducts.map((product) => ({
      code: product.carrier_product_code || `P-${String(product.id).padStart(3, '0')}`,
      name: product.name,
      description: product.description,
      status: (product.status.charAt(0).toUpperCase() + product.status.slice(1)) as 'Active' | 'Inactive',
      commissionRate: parseFloat(product.commission_rate?.toString() || '0'),
      agentCommission: (product as any).agentCommission ?? null,
      link: `/${product.lobSlug}/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      lobId: product.lob_id,
      lobName: product.lobName,
      providerName: product.providerName,
    }))
  }, [lobProducts])

  return (
    <div>
      <DataTable<Product, unknown>
        header="Assigned Products"
        description="Products you're authorized to sell"
        data={products}
        columns={columns}
        renderMode="table"
        searchKey="name"
        actions={[]}
        onRowClick={() => {}}
        isLoading={isLoading}
      />
    </div>
  )
}

export default MyProductsPage
