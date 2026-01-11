'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAgentCodeStore } from '@/store/agent-code-store'

export default function RootPage() {
  const router = useRouter()
  const { agentCode } = useAgentCodeStore()

  useEffect(() => {
    if (agentCode) {
      router.replace(`/${agentCode}`)
    } else {
      router.replace('/VbiKN9PpML')
    }
  }, [agentCode, router])

  return null
}
