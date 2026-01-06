'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useRouter } from 'next/navigation'

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
        router.push('/not-found')
      }
      setAgentCode(resolvedParams['agent-code'])
    }
  }, [resolvedParams, setAgentCode])

  return <div>{children}</div>
}
