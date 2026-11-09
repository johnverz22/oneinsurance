'use client'

import { useState } from 'react'
import { FileCheck, TextSearch } from 'lucide-react'
import { PortalContentHeader } from '@/components/layout/portal-content-header'
import { PillTabs } from '@/components/ui/pill-tabs'
import { ProductsTab } from './products-tab'
import { LobsTab } from './lobs-tab'

const TABS = [
  { id: 'products', label: 'Products', icon: FileCheck },
  { id: 'lobs', label: 'Lines of business', icon: TextSearch },
]

export function ProductsClient() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <>
      <PortalContentHeader
        title="Products & lines of business"
        description="Set up a line of business before adding an insurance product. Keep products grouped under the right business area."
      />
      <div className="mx-auto w-full max-w-7xl">
        <section className="mt-4 min-w-0 rounded-lg border border-[#dfe7df] bg-white p-5 dark:border-[#3d4140] dark:bg-[#171919] sm:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-main)]">
              Catalog management
            </h2>
            <p className="mt-1 text-sm text-[#5b6e61] dark:text-[#b2b7b4]">
              Create a LoB, then add products to it.
            </p>
          </div>

          <PillTabs
            tabs={TABS}
            active={activeTab}
            onChange={setActiveTab}
            className="mt-5"
          />

          <div className="mt-5">
            {activeTab === 'products' ? <ProductsTab /> : <LobsTab />}
          </div>
        </section>
      </div>
    </>
  )
}
