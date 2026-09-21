'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useRouter, usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { NAVIGATIONS } from '@/constants/navigations'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'

export default function ProductsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'agent-code': string }>
}) {
  const resolvedParams = use(params)
  const { setAgentCode, agentCode } = useAgentCodeStore()

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (resolvedParams['agent-code']) {
      const agentCode = resolvedParams['agent-code'].trim()
      if (!agentCode || agentCode.length !== 10 || agentCode === 'null') {
        notFound()
      }
      setAgentCode(resolvedParams['agent-code'])
    }
  }, [resolvedParams, setAgentCode])

  const isProductPage =
    pathname.includes('travel') ||
    pathname.includes('health') ||
    pathname.includes('ctpl') ||
    pathname.includes('motor')

  return (
    <>
      {!isProductPage && (
        <>
          <Header navigations={NAVIGATIONS} isNavigationVisible={true} showSidebarTrigger={false} />
          <div className="sm:hidden">
            <AppSidebar side="right" navigations={NAVIGATIONS} />
          </div>
        </>
      )}

      {/* Product pages: dark hero at top — overlay a transparent, light-text nav
          on landing pages only. Sub-pages (/avail etc.) manage their own
          header and suppress this one entirely. */}
      {isProductPage && !pathname.includes('/avail') && (
        <div className="hidden md:block">
          <Header
            navigations={NAVIGATIONS}
            isNavigationVisible={true}
            showSidebarTrigger={false}
            showBrand={true}
            variant={
              pathname.endsWith('/travel-insurance') ||
              pathname.endsWith('/motor-insurance') ||
              pathname.endsWith('/health-insurance')
                ? 'transparent'
                : 'default'
            }
            contentContainerClassName="pr-52 lg:pr-60"
          />
        </div>
      )}

      <main className="min-h-full w-full">{children}</main>

      {/* Avail pages: footer hidden on mobile (fixed action bar takes that space),
          shown on lg+ where the action bar is not rendered */}
      {!pathname.includes('/avail') && <Footer />}
      {pathname.includes('/avail') && (
        <div className="hidden lg:block">
          <Footer />
        </div>
      )}
    </>
  )
}
