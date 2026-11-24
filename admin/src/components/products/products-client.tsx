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
  const [lobCreateNonce, setLobCreateNonce] = useState(0)

  function openLobCreator() {
    setActiveTab('lobs')
    setLobCreateNonce((n) => n + 1)
  }

  return (
    <>
      <PortalContentHeader
        title="Product catalog"
        description="Create a line of business first, then add products to the right area."
      />
      <>
        <section className="mt-6" aria-label="Product catalog">
          <PillTabs
            tabs={TABS}
            active={activeTab}
            onChange={setActiveTab}
            className="mt-6"
          />
          <div className="mt-6">
            {activeTab === 'products' ? (
              <ProductsTab onCreateLob={openLobCreator} />
            ) : (
              <LobsTab
                createNonce={lobCreateNonce}
                onCreateNonceConsumed={() => setLobCreateNonce(0)}
              />
            )}
          </div>
        </section>
      </>
    </>
  )
}
