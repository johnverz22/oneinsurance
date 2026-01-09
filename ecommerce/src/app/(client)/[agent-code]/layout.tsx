'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/layout/sidebar'
import { Footer } from '@/components/layout/footer'
import { NAVIGATIONS } from '@/constants/navigations'
import { notFound } from 'next/navigation'

export default function ProductsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'agent-code': string }>
}) {
  const resolvedParams = use(params)
  const { setAgentCode } = useAgentCodeStore()

  const router = useRouter()

  useEffect(() => {
    if (resolvedParams['agent-code']) {
      const agentCode = resolvedParams['agent-code'].trim()
      if (!agentCode || agentCode.length !== 10 || agentCode === "null") {
        notFound()
      }
      setAgentCode(resolvedParams['agent-code'])
    }
  }, [resolvedParams, setAgentCode])

  return (<>
        <div className="h-full w-full">
          {/* <Header navigations={NAVIGATIONS} isNavigationVisible={true} /> */}
          <div className="sm:hidden">
            <AppSidebar navigations={NAVIGATIONS} />
          </div>
        </div>
  
        <main className="h-full w-full">{children}</main>
  
        <Footer />
      </>
    )
}
