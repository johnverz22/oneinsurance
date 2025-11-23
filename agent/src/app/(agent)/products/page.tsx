'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { ProductCard } from '@/components/agent/product-card'
import { Product } from '@/types/agent/product'

const PRODUCTS: Product[] = [
  {
    code: 'P-001',
    description: 'Travel Insurance',
    provider: 'OONA',
    commissionRate: 30,
    status: 'Active',
  },
  {
    code: 'P-002',
    description: 'Comprehensive Auto',
    provider: 'OONA',
    commissionRate: 25,
    status: 'Active',
  },
  {
    code: 'P-003',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commissionRate: 30,
    status: 'Active',
  },
  {
    code: 'P-004',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commissionRate: 25,
    status: 'Active',
  },
  {
    code: 'P-005',
    description: 'Personal Accident',
    provider: 'MICO',
    commissionRate: 30,
    status: 'Active',
  },
  {
    code: 'P-006',
    description: 'e-CTPL',
    provider: 'OONA',
    commissionRate: 25,
    status: 'Active',
  },
]

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'code' },
  { accessorKey: 'description' },
  { accessorKey: 'provider' },
  { accessorKey: 'commissionRate' },
  { accessorKey: 'status' },
]

const MyProductsPage = () => {
  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <DataTable<Product, unknown>
        header="Assigned Products"
        description="Products you're auhorized to sell"
        data={PRODUCTS}
        columns={columns}
        renderMode="list"
        numColumns={2}
        contentRenderer={(row) => <ProductCard product={row.original} />}
        searchKey="description"
        actions={[]}
        onRowClick={(client) => console.log('Clicked row:', client)}
      />
    </div>
  )
}

export default MyProductsPage
