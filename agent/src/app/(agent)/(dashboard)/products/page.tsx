'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { ProductCard } from '@/components/agent/product-card'
import { Product } from '@/types/agent/product'
// import { PRODUCTS } from './products'
import { useGetProducts } from '@/app/data/queries/products'
import { AgentProduct } from '@/types/products'
import { useEffect, useState } from 'react'
import { delay } from '@/utils/delay'

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'code' },
  { accessorKey: 'description' },
  { accessorKey: 'provider' },
  { accessorKey: 'commissionRate' },
  { accessorKey: 'status' },
]

function mapAgentProductToMappedProduct(
  input: AgentProduct,
  providerName?: string
): Product {
  const code = `P-${String(input.product_id).padStart(3, '0')}`

  const link = `products/${input.product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

  const status = input.status.charAt(0).toUpperCase() + input.status.slice(1)

  return {
    code,
    description: input.product.name,
    provider: (providerName as any) || 'OONA',
    commissionRate: parseFloat(input.commission_rate),
    status: status as any,
    link,
  }
}

const MyProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data, isError } = useGetProducts()

  useEffect(() => {
    async function fetchData() {
      await delay(3000)
      if (data) {
        const mappedProducts = data.data.data.map((agentProducts) => {
          return mapAgentProductToMappedProduct(agentProducts)
        })
        setProducts(mappedProducts)
        setIsLoading(false)
      }
    }
    fetchData()
  }, [data])

  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <DataTable<Product, unknown>
        header="Assigned Products"
        description="Products you're auhorized to sell"
        data={products}
        columns={columns}
        renderMode="list"
        numColumns={2}
        contentRenderer={(row) => <ProductCard product={row.original} />}
        searchKey="description"
        actions={[]}
        onRowClick={(client) => console.log('Clicked row:', client)}
        isLoading={isLoading}
      />
    </div>
  )
}

export default MyProductsPage
