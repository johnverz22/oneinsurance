'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

// Health Insurance is hidden on dev branch.
// Full implementation lives on feature/health-insurance branch.
export default function HealthInsurancePage() {
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string

  useEffect(() => {
    router.replace(`/${agentCode}/coming-soon`)
  }, [agentCode, router])

  return null
}
