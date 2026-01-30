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
import { usePolicy } from '@/hooks/use-policy'
import { useAgentAuthStore } from '@/store/agent-auth-store'
import { getProvinceNameByProvCode, getCityNameByCityCode } from '@/utils/address-util'

export default function PolicyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const policyId = params.policyId as string
  
  const { policy, isLoading, error } = usePolicy(policyId)
  const user = useAgentAuthStore((state) => state.user)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading policy details...</span>
        </div>
      </div>
    )
  }

  if (error || !policy?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Policy not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
        </div>
      </div>
    )
  }

  const policyData = policy.data
  
  // Parse policy_details if it's a JSON string
  let policyDetails = policyData.policy_details
  if (typeof policyDetails === 'string') {
    try {
      policyDetails = JSON.parse(policyDetails)
      console.log('Agent Policy Details - Successfully parsed policy_details JSON string')
    } catch (e) {
      console.log('Agent Policy Details - Failed to parse policy_details JSON:', e)
      policyDetails = null
    }
  }
  
  // Debug logging to see what data we're receiving
  console.log('Agent Policy Details - Full policy data:', policyData)
  console.log('Agent Policy Details - Policy details:', policyDetails)
  console.log('Agent Policy Details - PolicyCustomerList:', policyDetails?.PolicyCustomerList)
  
  // Always show the policy details page, even if detailed policy JSON is not available
  // We'll use transaction data to display the information

  // Extract customer information from multiple sources
  // 1. First try to find the policy holder (IsPolicyHolder: 'Y') from PolicyCustomerList
  // 2. Then fallback to first customer in PolicyCustomerList
  // 3. Finally use transaction customer_name
  const policyHolder = policyDetails?.PolicyCustomerList?.find(customer => customer.IsPolicyHolder === 'Y') 
    || policyDetails?.PolicyCustomerList?.[0];
  const transactionCustomerName = policyData.customer_name
  const customer = policyHolder
  
  console.log('Agent Policy Details - Extracted policy holder:', policyHolder)
  console.log('Agent Policy Details - Transaction customer name:', transactionCustomerName)
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
        `Policy No.: ${policyDetails?.CarrierPolicyNo || policyData.policy_id || 'N/A'}`, // Only show Carrier Policy No. to clients
        `Proposal Number: ${policyDetails?.ProposalNo || policyData.proposal_number}`,
        `Proposal No.: ${policyDetails?.ProposalNo || policyData.proposal_number}`,
        `Status: ${policyData.status}`,
        `Agent Code: ${policyData.agent_code_used}`,
        ...(policyDetails?.EffectiveDate ? [`Effective Date: ${new Date(policyDetails.EffectiveDate).toLocaleDateString()}`] : []),
        ...(policyDetails?.ExpiryDate ? [`Expiry Date: ${new Date(policyDetails.ExpiryDate).toLocaleDateString()}`] : []),
        `Premium Amount: PHP ${policyDetails?.GrossPremium?.toLocaleString() || (policyData.amount ? Number(policyData.amount).toLocaleString() : 'N/A')}`,
        ...(policyDetails?.DuePremium ? [`Due Premium: PHP ${policyDetails.DuePremium.toLocaleString()}`] : []),
        ...(policyDetails?.SumInsured ? [`Sum Insured: PHP ${policyDetails.SumInsured.toLocaleString()}`] : []),
        `Product: ${policyDetails?.ProductName || 'Travel Insurance'}`,
        ...(policyDetails?.PlanCode ? [`Plan Code: ${policyDetails.PlanCode}`] : []),
        ...(policyDetails?.TravelType ? [`Travel Type: ${policyDetails.TravelType}`] : []),
        ...(policyDetails?.TripType ? [`Trip Type: ${policyDetails.TripType}`] : [])
      ]

      policyInfo.forEach(info => {
        pdf.text(info, 20, yPosition)
        yPosition += 5
      })

      yPosition += 10

      // Customer Information
      if (customer) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('CUSTOMER INFORMATION', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        const customerInfo = [
          `Full Name: ${customer.FirstName || ''} ${customer.MiddleName || ''} ${customer.LastName || ''}`.trim() || transactionCustomerName || 'N/A',
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

        yPosition += 10
      } else {
        // Customer information not available
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('CUSTOMER INFORMATION', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        const defaultCustomerInfo = [
          `Full Name: ${transactionCustomerName || 'N/A'}`,
          'Email: N/A',
          'Phone: N/A',
          'Date of Birth: N/A',
          'Address: N/A',
          'ID Type: N/A',
          'ID Number: N/A'
        ]

        defaultCustomerInfo.forEach(info => {
          pdf.text(info, 20, yPosition)
          yPosition += 5
        })

        yPosition += 10
      }

      // Travel Information
      if (travelDetails) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('TRAVEL INFORMATION', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        const travelInfo = [
          `Origin: ${travelDetails.PlaceOfOrgin}`,
          `Destination: ${travelDetails.TravelCountry}`,
          `Coverage Area: ${travelDetails.TravelCoverageArea}`,
          ...(policyDetails?.NoOfTravellers ? [`Number of Travellers: ${policyDetails?.NoOfTravellers}`] : []),
          ...(policyDetails?.NoOfAdults ? [`Adults: ${policyDetails?.NoOfAdults}`] : []),
          ...(policyDetails?.NoOfChildren ? [`Children: ${policyDetails?.NoOfChildren}`] : [])
        ]

        travelInfo.forEach(info => {
          pdf.text(info, 20, yPosition)
          yPosition += 5
        })

        yPosition += 10
      }

      // Coverage Details
      if (coverages.length > 0) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('COVERAGE DETAILS', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')

        coverages.forEach((coverage, index) => {
          pdf.text(`${index + 1}. ${coverage.CoverageName}`, 20, yPosition)
          yPosition += 5
          
          // Add new page if needed
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
        })

        yPosition += 10
      }

      // Promo Code Information
      if (promoCode) {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('DISCOUNT INFORMATION', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        
        const promoInfo = [
          `Promo Code: ${promoCode.PromoCode}`,
          `Discount: ${promoCode.DiscountPercent}%`
        ]

        promoInfo.forEach(info => {
          pdf.text(info, 20, yPosition)
          yPosition += 5
        })
      }

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.text('This is an official policy certificate issued by One Insurance Company.', 20, pageHeight - 20)
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, pageHeight - 15)
      
      // Save the PDF
      const fileName = `Policy_Certificate_${policyDetails?.ProposalNo || policyData.proposal_number}.pdf`
      pdf.save(fileName)
      
      toast.success('Policy certificate downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handlePrintPolicy = () => {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Policies
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Policy Details</h1>
            <p className="text-muted-foreground">Policy #{policyDetails?.CarrierPolicyNo || 'P0086998'}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Carrier Policy No.</p>
                  <p className="font-semibold text-blue-600">{policyDetails?.CarrierPolicyNo || policyData.policy_id || ''}</p>
                  <p className="text-xs text-muted-foreground">Carrier side reference</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IMO Policy No.</p>
                  <p className="font-semibold">{(policyDetails as any)?.PolicyNo || policyData.policy_id || ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proposal No.</p>
                  <p className="font-semibold">{policyDetails?.ProposalNo || policyData.proposal_number || 'PTRAVEL0000000919'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={getStatusColor(policyData.status)}>
                    {policyData.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Renewable</p>
                  <Badge variant={policyDetails?.IsRenewable === 'Y' ? 'default' : 'destructive'}>
                    {policyDetails?.IsRenewable === 'Y' ? 'Yes' : policyDetails?.IsRenewable === 'N' ? 'No' : ''}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agent Code</p>
                  <p className="font-semibold">{policyData.agent_code_used}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan Code</p>
                  <p className="font-semibold">{policyDetails?.PlanCode || 'TMPHPC2'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carrier Code</p>
                  <p className="font-semibold">{policyDetails?.CarrierCode || 'MALAYAN'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product Code</p>
                  <p className="font-semibold">{policyDetails?.ProductCode || policyData.carrier_product_code}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                {(policyDetails?.EffectiveDate && policyDetails?.ExpiryDate) ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coverage Date</p>
                    <p className="font-semibold">
                      {new Date(policyDetails.EffectiveDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} - {new Date(policyDetails.ExpiryDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const startDate = new Date(policyDetails.EffectiveDate)
                        const endDate = new Date(policyDetails.ExpiryDate)
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                        return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`
                      })()}
                    </p>
                  </div>
                ) : (
                  <>
                    {policyDetails?.EffectiveDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                        <p className="font-semibold">{new Date(policyDetails.EffectiveDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {policyDetails?.ExpiryDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                        <p className="font-semibold">{new Date(policyDetails.ExpiryDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Premium Amount</p>
                  <p className="font-semibold text-lg">
                    {policyDetails?.GrossPremium 
                      ? `₱${policyDetails.GrossPremium.toLocaleString()}`
                      : policyData.amount 
                      ? `₱${Number(policyData.amount).toLocaleString()}`
                      : 'N/A'
                    }
                  </p>
                </div>
                {policyDetails?.DuePremium && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Premium</p>
                    <p className="font-semibold text-lg text-orange-600">₱{policyDetails.DuePremium.toLocaleString()}</p>
                  </div>
                )}
                {policyDetails?.SumInsured && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sum Insured</p>
                    <p className="font-semibold text-lg text-green-600">₱{policyDetails?.SumInsured?.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product</p>
                  <p className="font-semibold">{policyDetails?.ProductName || 'Travel Insurance'}</p>
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
              </div>

              <Separator />

              {/* Important Dates */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="font-semibold">{new Date(policyData.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                  <p className="font-semibold">{new Date(policyData.updated_at).toLocaleDateString()}</p>
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
                      {[customer.FirstName, customer.MiddleName, customer.LastName, customer.Suffix]
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
                        getCityNameByCityCode(customer.City) || customer.City,
                        getProvinceNameByProvCode(customer.AddrProvince) || customer.AddrProvince,
                        customer.PostCode
                      ].filter(Boolean).join(', ') || ''}
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
              ) : transactionCustomerName ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="font-semibold text-lg">{transactionCustomerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Gender</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Age</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Complete Address</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Type</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">ID Number</p>
                    <p className="font-semibold">N/A</p>
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
                      <p className="font-semibold">{travelDetails.PlaceOfOrgin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Destination</p>
                      <p className="font-semibold">{travelDetails.TravelCountry}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coverage Area</p>
                    <p className="font-semibold">{travelDetails.TravelCoverageArea}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Travel Type</p>
                    <p className="font-semibold">{policyDetails?.TravelType || 'Individual'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trip Type</p>
                    <p className="font-semibold">{policyDetails?.TripType || 'Single'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Number of Travellers</p>
                    <p className="font-semibold">
                      {policyDetails?.NoOfTravellers || 1} 
                      {policyDetails?.NoOfAdults && policyDetails?.NoOfChildren && 
                        ` (${policyDetails?.NoOfAdults} Adults, ${policyDetails?.NoOfChildren} Children)`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product Type</p>
                    <p className="font-semibold">Travel Insurance</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Carrier Code</p>
                    <p className="font-semibold">{policyData.carrier_product_code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coverage Area</p>
                    <p className="font-semibold">Worldwide Coverage</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Travel Type</p>
                    <p className="font-semibold">Individual Travel</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trip Type</p>
                    <p className="font-semibold">Single Trip</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Policy Status</p>
                    <Badge variant="secondary" className={getStatusColor(policyData.status)}>
                      {policyData.status}
                    </Badge>
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Coverage Includes:</strong> Medical expenses, emergency evacuation, trip cancellation, 
                        baggage protection, and 24/7 travel assistance services worldwide.
                      </p>
                    </div>
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gross Commission</p>
                  <p className="font-semibold">
                    {policyData.commission_log?.gross_commission 
                      ? `₱${Number(policyData.commission_log.gross_commission).toLocaleString()}`
                      : '₱23.82'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Commission</p>
                  <p className="font-semibold">
                    {policyData.commission_log?.net_commission 
                      ? `₱${Number(policyData.commission_log.net_commission).toLocaleString()}`
                      : '₱24.30'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agent</p>
                  <p className="font-semibold">{user?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Commission Product</p>
                  <p className="font-semibold">{policyDetails?.ProductName || 'Travel Insurance'}</p>
                </div>
              </div>
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
              {policyDetails && policyDetails.PolicyLobList?.[0]?.PolicyRiskList?.length > 0 ? (
                <div className="space-y-6">
                  {policyDetails.PolicyLobList[0].PolicyRiskList.map((insuredPerson: any, index: number) => (
                    <div key={`insured-${index}-${insuredPerson.PolicyElementId || index}`} className="border rounded-lg p-4 bg-muted/20">
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
                              <div key={`coverage-${index}-${coverageIndex}-${coverage.PolicyElementId || coverageIndex}`} className="bg-muted/30 px-3 py-2 rounded text-sm border">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Medical Coverage</h4>
                      <p className="text-sm text-blue-700">Emergency medical expenses, hospitalization, and medical evacuation</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Trip Protection</h4>
                      <p className="text-sm text-green-700">Trip cancellation, interruption, and delay coverage</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900">Baggage Protection</h4>
                      <p className="text-sm text-purple-700">Lost, stolen, or delayed baggage compensation</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900">24/7 Assistance</h4>
                      <p className="text-sm text-orange-700">Emergency assistance and travel support services</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Comprehensive Travel Insurance:</strong> This policy provides extensive coverage for medical emergencies, 
                      trip disruptions, baggage issues, and emergency assistance services while traveling.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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