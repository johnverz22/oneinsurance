'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/types/agent/product'
import { cn } from '@/lib/utils'

const PRODUCTS: Product[] = [
  {
    code: 'P-001',
    description: 'Travel Insurance',
    provider: 'OONA',
    commission_rate: 30,
    status: 'Active',
  },
  {
    code: 'P-002',
    description: 'Comprehensive Auto',
    provider: 'OONA',
    commission_rate: 25,
    status: 'Active',
  },
  {
    code: 'P-003',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commission_rate: 30,
    status: 'Active',
  },
  {
    code: 'P-004',
    description: 'Travel Insurance',
    provider: 'MALAYAN',
    commission_rate: 25,
    status: 'Active',
  },
  {
    code: 'P-005',
    description: 'Personal Accident',
    provider: 'MICO',
    commission_rate: 30,
    status: 'Active',
  },
  {
    code: 'P-006',
    description: 'e-CTPL',
    provider: 'OONA',
    commission_rate: 25,
    status: 'Active',
  },
]

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'code' },
  { accessorKey: 'description' },
  { accessorKey: 'provider' },
  { accessorKey: 'commission_rate' },
  { accessorKey: 'status' },
]

const MyProductsPage = () => {
  return (
    <div className="border-muted-foreground/20 rounded-xl border px-6 py-3.5">
      <DataTable<Product, unknown>
        header="Assigned Products"
        description="Products you're auhorized to sell"
        data={PRODUCTS}
        columns={columns}
        renderMode="list"
        numColumns={2}
        containerClassName="grid gap-x-12 gap-y-8 lg:grid-cols-2"
        contentRenderer={(row) => (
          <Card>
            <CardContent>
              <div className="flex w-full items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold md:text-lg lg:text-xl">
                    {row.original.description} by {row.original.provider}
                  </h3>
                  <p className="text-sm font-medium">
                    Commission Rate:{' '}
                    <span className="font-light">
                      {row.original.commission_rate}%
                    </span>
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'px-3 py-1 text-sm',
                    row.original.status === 'Active'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                      : 'text-muted bg-muted-foreground'
                  )}
                >
                  {row.original.status}
                </Badge>
              </div>

              <div className="mt-6 flex gap-4">
                <Button variant="outline" className="w-1/2">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        searchKey="description"
        actions={[]}
        onRowClick={(client) => console.log('Clicked row:', client)}
      />
    </div>
  )
}

export default MyProductsPage
