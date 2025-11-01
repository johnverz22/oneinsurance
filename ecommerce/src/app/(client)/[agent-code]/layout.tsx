'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { useAgentCodeStore } from '@/store/agent-code-store'

export default function ProductsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ 'agent-code': string }>
}) {
  const resolvedParams = use(params)
  const { setAgentCode } = useAgentCodeStore()

  useEffect(() => {
    if (resolvedParams['agent-code']) {
      setAgentCode(resolvedParams['agent-code'])
    }
  }, [resolvedParams, setAgentCode])

  return <div>{children}</div>
}
