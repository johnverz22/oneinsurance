import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabsContent } from '@radix-ui/react-tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterIcon } from 'lucide-react'
import ProductTab from '@/components/products/product-tabs'

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Product Assignment Management"
        subTitle="Assign insurance products to agents and manage access permissions"
      />
      <ProductTab />
    </>
  )
}
