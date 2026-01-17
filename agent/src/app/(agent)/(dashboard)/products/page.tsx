'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { ProductCard } from '@/components/agent/product-card'
import { Product } from '@/types/agent/product'
import { useGetAgentLOBProducts } from '@/app/data/queries/agent-lob-products'
import { useMemo } from 'react'

const columns: ColumnDef<Product>[] = [
  { 
    accessorKey: 'name',
    header: 'Product Name',
  },
  { 
    accessorKey: 'providerName',
    header: 'Provider',
  },
  { 
    accessorKey: 'lobName',
    header: 'Line of Business',
  },
  { 
    accessorKey: 'status',
    header: 'Status',
  },
]

const MyProductsPage = () => {
  const { data: lobProducts, isLoading } = useGetAgentLOBProducts()

  // Map LOB products to Product type
  const products = useMemo(() => {
    if (!lobProducts) return []

    return lobProducts.map((product) => {
      const commissionRate = parseFloat(product.commission_rate?.toString() || '0')
      
      const mappedProduct = {
        code: product.carrier_product_code || `P-${String(product.id).padStart(3, '0')}`,
        name: product.name,
        description: product.description,
        status: (product.status.charAt(0).toUpperCase() + product.status.slice(1)) as 'Active' | 'Inactive',
        commissionRate: commissionRate,
        link: `/${product.lobSlug}/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        lobId: product.lob_id,
        lobName: product.lobName,
        providerName: product.providerName,
      }

      return mappedProduct
    })
  }, [lobProducts])

  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <DataTable<Product, unknown>
        header="Assigned Products"
        description="Products you're authorized to sell"
        data={products}
        columns={columns}
        renderMode="list"
        numColumns={2}
        contentRenderer={(row) => <ProductCard product={row.original} />}
        searchKey="name"
        actions={[]}
        onRowClick={(client) => {}}
        isLoading={isLoading}
      />
    </div>
  )
}

export default MyProductsPage
