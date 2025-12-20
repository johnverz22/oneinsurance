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

const MyProductsPage = () => {
  const { data, isLoading } = useGetProducts()

  return (
    <div className="border-muted-foreground/20 rounded-xl border px-8 py-3.5">
      <DataTable<Product, unknown>
        header="Assigned Products"
        description="Products you're auhorized to sell"
        data={data ?? []}
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
