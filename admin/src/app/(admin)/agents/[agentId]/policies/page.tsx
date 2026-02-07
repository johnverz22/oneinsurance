'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGetAgentById } from '@/app/data/queries/agents'
import { AgentPolicyDataTable } from '@/components/agents/agent-policy-data-table'
import { Skeleton } from '@/components/ui/skeleton'

interface AgentPoliciesPageProps {
  params: Promise<{
    agentId: string
  }>
}

export default function AgentPoliciesPage({ params }: AgentPoliciesPageProps) {
  const router = useRouter()
  const [agentId, setAgentId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    params.then(({ agentId: agentIdStr }) => {
      const id = parseInt(agentIdStr)
      console.log('AgentPoliciesPage - Setting agentId:', id)
      setAgentId(id)
    })
  }, [params])

  const {
    data: agentData,
    isLoading: isLoadingAgent,
    error: agentError,
  } = useGetAgentById(agentId)

  const agent = agentData?.data

  console.log('AgentPoliciesPage - agentId:', agentId)
  console.log('AgentPoliciesPage - agent:', agent)
  console.log('AgentPoliciesPage - agent keys:', agent ? Object.keys(agent) : 'no agent')
  console.log('AgentPoliciesPage - isLoadingAgent:', isLoadingAgent)

  const handleBackClick = () => {
    router.push('/agents')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (!agentId || isLoadingAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (agentError || !agent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBackClick}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Agent Not Found</h1>
            <p className="text-muted-foreground">
              The requested agent could not be found.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with agent info and back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBackClick}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-600 mt-1">
              {agent ? (agent.name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email || `Agent ID: ${agent.id}`) : 'Loading agent...'}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => router.push(`/agents/${agentId}/profile`)}
        >
          View Agent Profile
        </Button>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-muted-foreground">
            View and manage all policy transactions, certificates, and coverage details for this agent.
          </p>
        </div>
        
        <AgentPolicyDataTable
          agentId={agentId}
          onPageChange={handlePageChange}
          currentPage={currentPage}
        />
      </div>
    </div>
  )
}