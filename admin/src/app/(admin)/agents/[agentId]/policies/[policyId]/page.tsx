'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Download, 
  Shield, 
  User, 
  Calendar, 
  CreditCard,
  Building,
  Printer,
  Loader2,
  Plane,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { useGetAgentById } from '@/app/data/queries/agents'
import { useGetPolicyDetails } from '@/app/data/queries/policies'
import { useAuthStore } from '@/store/auth-store'

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
  const user = useAuthStore((state) => state.user)

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

  if (isLoadingAgent || isLoadingPolicy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading policy details...</span>
        </div>
      </div>
    )
  }

  if (policyError || !policy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {policyError instanceof Error ? policyError.message : policyError || 'Policy not found'}
          </p>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
        </div>
      </div>
    )
  }

  const policyData = policy
  const policyDetails = policyData.policy_details
  
  // Debug logging to see what data we're receiving
  console.log('Admin Policy Details - Full policy data:', policyData)
  console.log('Admin Policy Details - Policy details:', policyDetails)
  console.log('Admin Policy Details - PolicyCustomerList:', policyDetails?.PolicyCustomerList)
  
  // Extract customer information from multiple sources
  // 1. First try policy details customer list (PolicyCustomerList)
  // 2. Then try customer_name from transaction
  // 3. Finally use fallback data
  const policyCustomer = policyDetails?.PolicyCustomerList?.[0]
  const transactionCustomerName = policyData.customer_name
  const customer = policyCustomer
  
  console.log('Admin Policy Details - Extracted customer:', customer)
  console.log('Admin Policy Details - Transaction customer name:', transactionCustomerName)
  const insuredPerson = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.[0]
  const coverages = insuredPerson?.PolicyCoverageList || []
  const travelDetails = policyDetails?.TravelDetailList?.[0]
  const promoCode = policyDetails?.PromoCodeList?.[0]

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const handleDownloadCertificate = async () => {
    try {
      // Import jsPDF
      const jsPDF = (await import('jspdf')).default

      const pdf = new jsPDF('p', 'mm', 'a4')
      let yPosition = 20

      // Header
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('POLICY CERTIFICATE', 20, yPosition)
      
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text('One Insurance Company', 20, yPosition + 10)
      
      yPosition += 25

      // Policy Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('POLICY INFORMATION', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const policyInfo = [
        `Policy Number: ${policyDetails?.PolicyNo || policyData.policy_id || 'N/A'}`,
        `Certificate Number: ${policyData.certificate_number || 'N/A'}`,
        `Status: ${policyData.status || 'N/A'}`,
        ...(policyDetails?.EffectiveDate ? [`Effective Date: ${new Date(policyDetails.EffectiveDate).toLocaleDateString()}`] : []),
        ...(policyDetails?.ExpiryDate ? [`Expiry Date: ${new Date(policyDetails.ExpiryDate).toLocaleDateString()}`] : []),
        `Premium Amount: PHP ${policyDetails?.GrossPremium?.toLocaleString() || (policyData.premium ? Number(policyData.premium).toLocaleString() : 'N/A')}`,
        `Product: ${policyDetails?.ProductName || policyData.plan_name || 'N/A'}`,
      ]

      policyInfo.forEach(info => {
        pdf.text(info, 20, yPosition)
        yPosition += 5
      })

      yPosition += 10

      // Customer Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CUSTOMER INFORMATION', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      if (customer) {
        const customerInfo = [
          `Full Name: ${`${customer.FirstName || ''} ${customer.MiddleName || ''} ${customer.LastName || ''}`.trim() || 'N/A'}`,
          `Email: ${customer.Email || 'N/A'}`,
          `Phone: ${customer.TempData?.['MaskAfter-Mobile'] || customer.Mobile || 'N/A'}`,
          `Date of Birth: ${customer.DateOfBirth ? new Date(customer.DateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'N/A'}`,
          `Address: ${customer.AddressLine1 || 'N/A'}, ${customer.AddressLine2 || ''}, ${customer.City || 'N/A'}`,
          `ID Type: ${customer.IdTypeCode === 'PAS' ? 'Passport' : customer.IdTypeCode === 'DL' ? "Driver's License" : customer.IdTypeCode || 'N/A'}`,
          `ID Number: ${customer.TempData?.['MaskAfter-IdNo'] || customer.IdNo || 'N/A'}`
        ]

        customerInfo.forEach(info => {
          pdf.text(info, 20, yPosition)
          yPosition += 5
        })
      } else {
        const defaultCustomerInfo = [
          `Full Name: ${policyData.customer_name || policyData.policy_holder || 'N/A'}`,
          `Email: ${policyData.customer_email || 'N/A'}`,
          `Phone: ${policyData.customer_phone || 'N/A'}`,
          'Date of Birth: N/A',
          'Address: N/A',
          'ID Type: N/A',
          'ID Number: N/A'
        ]

        defaultCustomerInfo.forEach(info => {
          pdf.text(info, 20, yPosition)
          yPosition += 5
        })
      }

      yPosition += 10

      // Commission Information
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('COMMISSION INFORMATION', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const commissionInfo = [
        `Gross Commission: PHP ${policyData.gross_commission ? Number(policyData.gross_commission).toLocaleString() : 'N/A'}`,
        `Net Commission: PHP ${policyData.net_commission ? Number(policyData.net_commission).toLocaleString() : 'N/A'}`,
        `Agent: ${policyData.agent ? `${policyData.agent.first_name || ''} ${policyData.agent.last_name || ''}`.trim() || policyData.agent.name || 'N/A' : 'N/A'}`,
        `Product: ${policyData.product?.name || policyData.plan_name || 'N/A'}`
      ]

      commissionInfo.forEach(info => {
        pdf.text(info, 20, yPosition)
        yPosition += 5
      })

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('This is an official policy certificate issued by One Insurance Company.', 20, pageHeight - 20)
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, pageHeight - 15)
      
      // Save the PDF
      const fileName = `Policy_Certificate_${policyData.certificate_number || policyData.policy_id}.pdf`
      pdf.save(fileName)
      
      toast.success('Policy certificate downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handlePrintPolicy = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Policy Details</h1>
            <p className="text-muted-foreground">
              {agent ? (agent.name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email || `Agent ID: ${agent.id}`) : 'Loading agent...'} • Certificate: {policyData.certificate_number || 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadCertificate}>
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
          <Button onClick={handlePrintPolicy}>
            <Printer className="h-4 w-4 mr-2" />
            Print Policy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Policy Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Policy Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                  <p className="font-semibold text-blue-600">{policyDetails?.PolicyNo || policyData.policy_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Certificate Number</p>
                  <p className="font-semibold">{policyData.certificate_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={getStatusColor(policyData.status || 'N/A')}>
                    {policyData.status || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Renewable</p>
                  <Badge variant={policyDetails?.IsRenewable === 'Y' ? 'default' : 'destructive'}>
                    {policyDetails?.IsRenewable === 'Y' ? 'Yes' : policyDetails?.IsRenewable === 'N' ? 'No' : 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider</p>
                  <p className="font-semibold">{policyData.provider || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                  <p className="font-semibold">
                    {policyDetails?.EffectiveDate 
                      ? new Date(policyDetails.EffectiveDate).toLocaleDateString()
                      : policyData.coverage_start || 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                  <p className="font-semibold">
                    {policyDetails?.ExpiryDate 
                      ? new Date(policyDetails.ExpiryDate).toLocaleDateString()
                      : policyData.coverage_end || 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Premium Amount</p>
                  <p className="font-semibold text-lg">
                    {policyDetails?.GrossPremium 
                      ? `₱${policyDetails.GrossPremium.toLocaleString()}`
                      : policyData.premium 
                      ? `₱${Number(policyData.premium).toLocaleString()}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currency</p>
                  <p className="font-semibold">{policyData.currency || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product</p>
                  <p className="font-semibold">{policyDetails?.ProductName || policyData.plan_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan Type</p>
                  <p className="font-semibold">{policyData.plan_type || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Holder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Policy Holder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="font-semibold text-lg">
                      {[customer.Title, customer.FirstName, customer.MiddleName, customer.LastName, customer.Suffix]
                        .filter(Boolean)
                        .join(' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                    <p className="font-semibold">
                      {customer.Gender === 'M' ? 'Male' : customer.Gender === 'F' ? 'Female' : customer.Gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold">{customer.Email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold">
                      {customer.TempData?.['MaskAfter-Mobile'] || customer.Mobile || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-semibold">
                      {customer.DateOfBirth ? 
                        new Date(customer.DateOfBirth).toLocaleDateString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: 'numeric' 
                        }) : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Age</p>
                    <p className="font-semibold">
                      {customer.DateOfBirth ? 
                        Math.floor((new Date().getTime() - new Date(customer.DateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' years'
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Complete Address</p>
                    <p className="font-semibold">
                      {[
                        customer.AddressLine1,
                        customer.AddressLine2,
                        customer.City,
                        customer.AddrProvince,
                        customer.PostCode
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Type</p>
                    <p className="font-semibold">
                      {customer.IdTypeCode === 'PAS' ? "Passport" : 
                       customer.IdTypeCode === 'DL' ? "Driver's License" :
                       customer.IdTypeCode === 'NID' ? "National ID" :
                       customer.IdTypeCode === 'SSS' ? "SSS ID" :
                       customer.IdTypeCode === 'TIN' ? "TIN ID" :
                       customer.IdTypeCode || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Number</p>
                    <p className="font-semibold">
                      {customer.TempData?.['MaskAfter-IdNo'] || customer.IdNo || 'N/A'}
                    </p>
                  </div>
                </div>
              ) : policyData.customer_name || policyData.policy_holder ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="font-semibold text-lg">{policyData.customer_name || policyData.policy_holder}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold">{policyData.customer_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold">{policyData.customer_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-semibold">{policyData.customer_dob || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Age</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Complete Address</p>
                    <p className="font-semibold">{policyData.customer_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Type</p>
                    <p className="font-semibold">{policyData.customer_id_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Number</p>
                    <p className="font-semibold">{policyData.customer_id_number || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No policy holder information available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Policy holder details are not available in the current policy data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Commission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Gross Commission</p>
                  <p className="font-semibold text-lg">
                    {policyData.gross_commission 
                      ? `₱${Number(policyData.gross_commission).toLocaleString()}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Agent</p>
                  <p className="font-semibold">
                    {policyData.agent 
                      ? `${policyData.agent.first_name || ''} ${policyData.agent.last_name || ''}`.trim() || policyData.agent.name || 'N/A'
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {policyData.agent?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Net Commission</p>
                  <p className="font-semibold text-lg">
                    {policyData.net_commission 
                      ? `₱${Number(policyData.net_commission).toLocaleString()}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Product</p>
                  <p className="font-semibold">
                    {policyData.product?.name || policyData.plan_name || 'N/A'}
                  </p>
                  {policyData.product?.category && (
                    <p className="text-sm text-muted-foreground">{policyData.product.category}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Travel Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {travelDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Origin</p>
                      <p className="font-semibold">{travelDetails.PlaceOfOrgin || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Destination</p>
                      <p className="font-semibold">{travelDetails.TravelCountry || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coverage Area</p>
                    <p className="font-semibold">{travelDetails.TravelCoverageArea || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Travel Type</p>
                    <p className="font-semibold">{policyDetails?.TravelType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trip Type</p>
                    <p className="font-semibold">{policyDetails?.TripType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Number of Travellers</p>
                    <p className="font-semibold">
                      {policyDetails?.NoOfTravellers || 'N/A'} 
                      {policyDetails?.NoOfAdults && policyDetails?.NoOfChildren && 
                        ` (${policyDetails.NoOfAdults} Adults, ${policyDetails.NoOfChildren} Children)`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product Type</p>
                    <p className="font-semibold">{policyData.plan_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Provider</p>
                    <p className="font-semibold">{policyData.provider || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coverage Area</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Travel Type</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trip Type</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Policy Status</p>
                    <Badge variant="secondary" className={getStatusColor(policyData.status || 'N/A')}>
                      {policyData.status || 'N/A'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Risk List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Policy Risk List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.length > 0 ? (
                <div className="space-y-6">
                  {policyDetails.PolicyLobList[0].PolicyRiskList.map((insuredPerson: any, index: number) => (
                    <div key={insuredPerson.PolicyElementId} className="border rounded-lg p-4 bg-muted/20">
                      {/* Insured Person Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {insuredPerson.InsuredName || 
                             [insuredPerson.FirstName, insuredPerson.MiddleName, insuredPerson.LastName]
                               .filter(Boolean).join(' ') || 'N/A'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{insuredPerson.IsMainInsured === 'Y' ? 'Main Insured' : 'Additional Insured'}</span>
                            <span>•</span>
                            <span>{insuredPerson.IsAdultTraveller === 'Y' ? 'Adult' : 'Child'}</span>
                            <span>•</span>
                            <span>Age: {insuredPerson.Age || 'N/A'}</span>
                          </div>
                        </div>
                        <Badge variant={insuredPerson.IsMainInsured === 'Y' ? 'default' : 'secondary'}>
                          {insuredPerson.IsMainInsured === 'Y' ? 'Primary' : 'Secondary'}
                        </Badge>
                      </div>

                      {/* Insured Person Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{insuredPerson.Email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">
                            {insuredPerson.TempData?.['MaskAfter-Mobile'] || insuredPerson.Mobile || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Gender</p>
                          <p className="text-sm font-medium">
                            {insuredPerson.Gender === 'M' ? 'Male' : insuredPerson.Gender === 'F' ? 'Female' : insuredPerson.Gender || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium">
                            {insuredPerson.DateOfBirth ? 
                              new Date(insuredPerson.DateOfBirth).toLocaleDateString('en-US', { 
                                month: '2-digit', 
                                day: '2-digit', 
                                year: 'numeric' 
                              }) : 'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Coverage List */}
                      {insuredPerson.PolicyCoverageList && insuredPerson.PolicyCoverageList.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-3 text-muted-foreground">
                            Coverage ({insuredPerson.PolicyCoverageList.length} items)
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {insuredPerson.PolicyCoverageList.map((coverage: any, coverageIndex: number) => (
                              <div key={coverage.PolicyElementId} className="bg-muted/30 px-3 py-2 rounded text-sm border">
                                <span className="text-foreground font-medium">{coverage.CoverageName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No detailed coverage information available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Policy Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Policy Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plan Code</p>
                <p className="font-semibold">{policyDetails?.PlanCode || 'TMPHPC2'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Carrier Code</p>
                <p className="font-semibold">{policyDetails?.CarrierCode || 'OONAPH'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product Code</p>
                <p className="font-semibold">{policyDetails?.ProductCode || policyData.carrier_product_code || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agent Code</p>
                <p className="font-semibold">{policyData.agent_code_used || 'N/A'}</p>
              </div>
              {policyDetails?.PremiumTaxAmt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Premium Tax</p>
                  <p className="font-semibold">₱{policyDetails.PremiumTaxAmt.toLocaleString()}</p>
                </div>
              )}
              {policyDetails?.LGT && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LGT</p>
                  <p className="font-semibold">₱{policyDetails.LGT.toLocaleString()}</p>
                </div>
              )}
              
              {/* Important Dates moved here */}
              {policyDetails?.ProposalDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proposal Date</p>
                  <p className="font-semibold">{new Date(policyDetails.ProposalDate).toLocaleDateString()}</p>
                </div>
              )}
              {policyDetails?.QuotationDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quotation Date</p>
                  <p className="font-semibold">{new Date(policyDetails.QuotationDate).toLocaleDateString()}</p>
                </div>
              )}
              {policyData.transaction_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction Date</p>
                  <p className="font-semibold">{new Date(policyData.transaction_date).toLocaleDateString()}</p>
                </div>
              )}
              {policyData.created_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="font-semibold">{new Date(policyData.created_at).toLocaleDateString()}</p>
                </div>
              )}
              {policyData.updated_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                  <p className="font-semibold">{new Date(policyData.updated_at).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Commission Information */}
          {policyData.commission_log && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Additional Commission Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
                  <p className="font-semibold">{policyData.commission_log.commission_rate || '0'}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">VAT Amount</p>
                  <p className="font-semibold">₱{Number(policyData.commission_log.vat_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Withholding Tax</p>
                  <p className="font-semibold">₱{Number(policyData.commission_log.withholding_tax_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Base Commission</p>
                  <p className="font-semibold">₱{Number(policyData.commission_log.base_commission || 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discount Information */}
          {promoCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Discount Applied
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Promo Code</p>
                  <p className="font-semibold text-green-600">{promoCode.PromoCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Discount Percentage</p>
                  <p className="font-semibold text-green-600">{promoCode.DiscountPercent}%</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}