'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGetAgentById } from '@/app/data/queries/agents'
import { useGetPolicyDetails } from '@/app/data/queries/policies'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import jsPDF from 'jspdf'

interface AgentPolicyDetailsPageProps {
  params: Promise<{
    agentId: string
    policyId: string
  }>
}

export default function AgentPolicyDetailsPage({ params }: AgentPolicyDetailsPageProps) {
  const router = useRouter()
  const [agentId, setAgentId] = React.useState<number | null>(null)
  const [policyId, setPolicyId] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then(({ agentId: agentIdStr, policyId: policyIdStr }) => {
      setAgentId(parseInt(agentIdStr))
      setPolicyId(policyIdStr)
    })
  }, [params])

  const {
    data: agentData,
    isLoading: isLoadingAgent,
  } = useGetAgentById(agentId)

  const {
    data: policyResponse,
    isLoading: isLoadingPolicy,
    error: policyError,
  } = useGetPolicyDetails(policyId)

  const agent = agentData?.data
  const policy = policyResponse?.data

  const handleBackClick = () => {
    if (agentId) {
      router.push(`/agents/${agentId}/policies`)
    }
  }

  // Use real policy data from API or fallback to mock data with customer information
  const policyData = policy ? {
    certificate_number: policy.certificate_number || `CERT-${policyId}`,
    policy_holder: policy.policy_holder || 'John Michael Doe',
    plan_name: policy.plan_name || 'OONA Travel',
    plan_type: policy.plan_type || 'Travel Insurance',
    premium: policy.premium || '25000',
    currency: policy.currency || 'PHP',
    coverage_start: policy.coverage_start ? new Date(policy.coverage_start).toLocaleDateString() : '1/15/2024',
    coverage_end: policy.coverage_end ? new Date(policy.coverage_end).toLocaleDateString() : '12/15/2024',
    status: policy.status || 'active',
    provider: policy.provider || 'OONA',
    policy_details: policy.policy_details || {
      sum_insured: policy.gross_commission || '1000000',
      deductible: '5000',
      beneficiary: policy.agent ? `${policy.agent.first_name} ${policy.agent.last_name}` : 'N/A',
      emergency_contact: '+63 917 123 4567',
    },
    // Customer information - use real data if available, otherwise use mock data
    customer_name: policy.customer_name || policy.policy_holder || 'John Michael Doe',
    customer_email: policy.customer_email || 'john.doe@email.com',
    customer_phone: policy.customer_phone || '+63 917 123 4567',
    customer_address: policy.customer_address || '123 Main Street, Makati City, Metro Manila',
    customer_dob: policy.customer_dob || '6/15/1985',
    customer_id_type: policy.customer_id_type || 'Driver\'s License',
    customer_id_number: policy.customer_id_number || 'N01-85-123456',
  } : {
    certificate_number: 'CERT-000004',
    policy_holder: 'John Michael Doe',
    plan_name: 'OONA Travel',
    plan_type: 'Travel Insurance',
    premium: '25000',
    currency: 'PHP',
    coverage_start: '1/15/2024',
    coverage_end: '12/15/2024',
    status: 'active',
    provider: 'OONA',
    policy_details: {
      sum_insured: '1000000',
      deductible: '5000',
      beneficiary: 'Jane Doe',
      emergency_contact: '+63 917 123 4567',
    },
    // Mock customer information
    customer_name: 'John Michael Doe',
    customer_email: 'john.doe@email.com',
    customer_phone: '+63 917 123 4567',
    customer_address: '123 Main Street, Makati City, Metro Manila',
    customer_dob: '6/15/1985',
    customer_id_type: 'Driver\'s License',
    customer_id_number: 'N01-85-123456',
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('CONFIRMATION OF COVERAGE', 20, 30)
    
    // Policy details
    doc.setFontSize(12)
    doc.text(`Certificate Number: ${policyData.certificate_number}`, 20, 50)
    doc.text(`Policyholder: ${policyData.policy_holder}`, 20, 65)
    doc.text(`Plan: ${policyData.plan_name}`, 20, 80)
    doc.text(`Premium: ₱${parseFloat(policyData.premium).toLocaleString()}`, 20, 95)
    doc.text(`Coverage Period: ${policyData.coverage_start} to ${policyData.coverage_end}`, 20, 110)
    
    // Save the PDF
    doc.save(`policy-${policyData.certificate_number}.pdf`)
  }
  if (isLoadingAgent || isLoadingPolicy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (policyError) {
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
            <h1 className="text-2xl font-bold">Policy Details</h1>
            <p className="text-muted-foreground">Error loading policy details</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Failed to load policy details. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="text-2xl font-bold">Policy Details</h1>
            <p className="text-muted-foreground">
              {agent ? (agent.name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email || `Agent ID: ${agent.id}`) : 'Loading agent...'} • Certificate: {policyData.certificate_number}
            </p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download Certificate
        </Button>
      </div>
      {/* Policy Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Confirmation of Coverage</h2>
            <Badge className="bg-green-100 text-green-800">
              {policyData.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Certificate Number</label>
                <p className="text-lg font-semibold">{policyData.certificate_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Policyholder</label>
                <p className="text-lg">{policyData.policy_holder}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plan Name</label>
                <p className="text-lg">{policyData.plan_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plan Type</label>
                <p className="text-lg">{policyData.plan_type}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Premium</label>
                <p className="text-lg font-semibold">₱{parseFloat(policyData.premium).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Currency</label>
                <p className="text-lg">{policyData.currency}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Coverage Period</label>
                <p className="text-lg">{policyData.coverage_start} to {policyData.coverage_end}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Provider</label>
                <p className="text-lg">{policyData.provider}</p>
              </div>
            </div>
          </div>

          {/* Policy Holder Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Policy Holder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg">{policyData.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{policyData.customer_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{policyData.customer_phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-lg">{policyData.customer_dob}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg">{policyData.customer_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Type</label>
                  <p className="text-lg">{policyData.customer_id_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID Number</label>
                  <p className="text-lg">{policyData.customer_id_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {policy && (policy.gross_commission || policy.net_commission || policy.agent) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Commission Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {policy.gross_commission && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gross Commission</label>
                      <p className="text-lg">₱{parseFloat(policy.gross_commission).toLocaleString()}</p>
                    </div>
                  )}
                  {policy.net_commission && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Net Commission</label>
                      <p className="text-lg">₱{parseFloat(policy.net_commission).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {policy.agent && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Agent</label>
                      <p className="text-lg">{policy.agent.first_name} {policy.agent.last_name}</p>
                      {policy.agent.email && (
                        <p className="text-sm text-gray-600">{policy.agent.email}</p>
                      )}
                    </div>
                  )}
                  {policy.product && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Product</label>
                      <p className="text-lg">{policy.product.name}</p>
                      {policy.product.category && (
                        <p className="text-sm text-gray-600">{policy.product.category}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}