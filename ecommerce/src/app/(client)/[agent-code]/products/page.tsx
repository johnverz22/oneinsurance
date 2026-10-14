'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { ArrowDownUp, Filter, TextSearch } from 'lucide-react'
import { InsuranceCard } from '@/components/insurance-card'
import { INSURANCES } from '@/constants/insurances'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PRODUCT_FLAGS, ProductKey } from '@/lib/product-flags'

export default function ProductsPage() {
  const [searchFilter, setSearchFilter] = useState('')

  const FILTERED_INSURANCES = useMemo(() => {
    if (!searchFilter) return INSURANCES

    return INSURANCES.filter((insurance) =>
      insurance.title.toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [searchFilter])

  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value)
  }

  return (
    <div className="relative py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="space-y-4 text-center">
          <h2 className="from-primary to-tertiary bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
            Our Products
          </h2>
          <p className="text-lg font-normal">
            <span className="font-semibold">Protect what matters to you:</span>{' '}
            Trusted by over 1 million Filipinos, we provide a wide
            <br />
            range of general insurance products tailored to your needs.
          </p>

          <div className="flex items-center justify-center gap-2 py-6">
            <div className="w-full max-w-md flex-1/2">
              <Input
                className="h-10 w-full sm:h-12"
                placeholder="Search plans..."
                value={searchFilter}
                onChange={handleSearchInputChange}
              />
            </div>
            <Button
              type="button"
              className="bg-primary from-primary to-accent relative h-10 w-full flex-1/2 self-end rounded-full bg-gradient-to-r via-90% px-6 text-sm font-medium text-white shadow-lg hover:bg-success disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-auto lg:max-w-48 dark:text-white"
              size="lg"
            >
              <ArrowDownUp />
              Recommended
            </Button>
            <Button
              type="button"
              variant="outline"
              className="relative h-10 w-full flex-1/2 self-end rounded-full sm:h-12 sm:w-auto lg:max-w-48"
              size="lg"
            >
              <Filter />
              Filter
            </Button>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-8">
          {FILTERED_INSURANCES.length > 0 ? (
            FILTERED_INSURANCES.map((product, index) => {
              const productKey = product.checkoutLink.split('/').pop() || ''
              const isEnabled = PRODUCT_FLAGS[productKey] ?? false

              return (
                <InsuranceCard
                  key={index}
                  variant="expanded"
                  className="md:w-full"
                  enabled={isEnabled}
                  {...product}
                />
              )
            })
          ) : (
            <div className="bg-muted-foreground/20 border-muted-foreground/30 flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg border p-12">
              <TextSearch size={64} strokeWidth={0.75} />
              No Products Found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
