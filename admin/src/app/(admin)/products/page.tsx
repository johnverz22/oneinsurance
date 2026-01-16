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
        title="Products & Line of Business"
        subTitle="Manage line of business, insurance products, and agent assignments"
      />
      <ProductTab />
    </>
  )
}
