'use client'

import React, { useState } from 'react'
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
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Mail,
  Users
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
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    policyHolder: true,
    travel: true,
    coverage: true,
    beneficiaries: false,
    technical: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading policy details...</span>
        </div>
      </div>
    )
  }

  if (error || !policy?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-destructive font-medium">{error || 'Policy not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
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
    } catch (e) {
      policyDetails = null
    }
  }
  
  // Extract customer information
  const policyHolder = policyDetails?.PolicyCustomerList?.find(customer => customer.IsPolicyHolder === 'Y') 
    || policyDetails?.PolicyCustomerList?.[0];
  const transactionCustomerName = policyData.customer_name
  const customer = policyHolder
  const insuredPerson = policyDetails?.PolicyLobList?.[0]?.PolicyRiskList?.[0]
  const coverages = insuredPerson?.PolicyCoverageList || []
  const travelDetailsList = policyDetails?.TravelDetailList || []
  const travelDetails = travelDetailsList[0] // Keep for backward compatibility
  const promoCode = policyDetails?.PromoCodeList?.[0]

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const toTitleCase = (str: string) => {
    if (!str) return str
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleDownloadCertificate = async () => {
    try {
      const jsPDF = (await import('jspdf')).default
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      let yPosition = 20

      // Colors matching One Insurance branding
      const primaryGreen = [76, 132, 62] // #4C843E
      const accentGold = [189, 183, 107] // #BDB76B
      const lightGreen = [230, 242, 227] // #E6F2E3
      const darkGray = [51, 51, 51]
      const borderGray = [200, 200, 200]

      // ===== HEADER =====
      // Logo and branding
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      pdf.text('One', margin, yPosition)
      
      const oneWidth = pdf.getTextWidth('One')
      pdf.setTextColor(accentGold[0], accentGold[1], accentGold[2])
      pdf.text('Insurance', margin + oneWidth + 1, yPosition)

      // Tagline
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Insurance Made Simple. Coverage Made Easy.', margin, yPosition + 5)

      // POLICY CERTIFICATE badge (right side)
      const badgeWidth = 55
      const badgeHeight = 11
      const badgeX = pageWidth - margin - badgeWidth
      const badgeY = yPosition - 6
      
      pdf.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F')
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('POLICY CERTIFICATE', badgeX + badgeWidth / 2, badgeY + 7.5, { align: 'center' })

      // Policy number and date (right side, below badge)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(80, 80, 80)
      pdf.text(`Policy No: ${policyDetails?.CarrierPolicyNo || 'N/A'}`, pageWidth - margin, badgeY + badgeHeight + 5, { align: 'right' })
      pdf.text(`Issued: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`, pageWidth - margin, badgeY + badgeHeight + 9, { align: 'right' })

      yPosition += 18

      // Separator line
      pdf.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      pdf.setLineWidth(1)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      
      yPosition += 12

      // ===== POLICY INFORMATION =====
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      pdf.text('Policy Information', margin, yPosition)
      yPosition += 7

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2])
      
      const policyInfo = [
        `Policy No.: ${policyDetails?.CarrierPolicyNo || 'N/A'}`,
        `Status: ${policyData.status}`,
        `Agent Code: ${policyData.agent_code_used}`,
        ...(policyDetails?.EffectiveDate ? [`Effective Date: ${new Date(policyDetails.EffectiveDate).toLocaleDateString()}`] : []),
        ...(policyDetails?.ExpiryDate ? [`Expiry Date: ${new Date(policyDetails.ExpiryDate).toLocaleDateString()}`] : []),
        `Premium Amount: PHP ${policyDetails?.GrossPremium?.toLocaleString() || (policyData.amount ? Number(policyData.amount).toLocaleString() : 'N/A')}`,
        ...(policyDetails?.DuePremium != null && Number(policyDetails.DuePremium) !== 0 ? [`Due Premium: PHP ${policyDetails.DuePremium.toLocaleString()}`] : []),
        ...(policyDetails?.SumInsured != null && Number(policyDetails.SumInsured) !== 0 ? [`Sum Insured: PHP ${policyDetails.SumInsured.toLocaleString()}`] : []),
        `Product: ${policyDetails?.ProductName || 'Travel Insurance'}`,
        ...(policyDetails?.PlanCode ? [`Plan Code: ${policyDetails.PlanCode}`] : []),
        ...(policyDetails?.TravelType ? [`Travel Type: ${policyDetails.TravelType}`] : []),
        ...(policyDetails?.TripType ? [`Trip Type: ${policyDetails.TripType}`] : [])
      ]

      policyInfo.forEach(info => {
        pdf.text(info, margin, yPosition)
        yPosition += 5
      })

      yPosition += 8

      // ===== CUSTOMER INFORMATION =====
      if (customer) {
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
        pdf.text('Customer Information', margin, yPosition)
        yPosition += 7

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
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
          pdf.text(info, margin, yPosition)
          yPosition += 5
        })

        yPosition += 8
      }

      // ===== TRAVEL INFORMATION =====
      if (travelDetailsList.length > 0) {
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
        pdf.text('Travel Information', margin, yPosition)
        yPosition += 7

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2])
        
        const travelInfo = [
          `Origin: ${travelDetails?.PlaceOfOrgin || 'N/A'}`,
          `Destination: ${travelDetailsList.map((detail: any) => detail.TravelCountry).join(', ') || 'N/A'}`,
          `Coverage Area: ${travelDetails?.TravelCoverageArea || 'N/A'}`,
          ...(policyDetails?.NoOfTravellers ? [`Number of Travellers: ${String(policyDetails.NoOfTravellers)}`] : []),
          ...(policyDetails?.NoOfAdults ? [`Adults: ${String(policyDetails.NoOfAdults)}`] : []),
          ...(policyDetails?.NoOfChildren ? [`Children: ${String(policyDetails.NoOfChildren)}`] : [])
        ]

        travelInfo.forEach(info => {
          pdf.text(info, margin, yPosition)
          yPosition += 5
        })

        yPosition += 8
      }

      // ===== COVERAGE DETAILS =====
      if (coverages.length > 0) {
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
        pdf.text('Coverage Details', margin, yPosition)
        yPosition += 7

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2])

        coverages.forEach((coverage, index) => {
          pdf.text(`${index + 1}. ${coverage.CoverageName}`, margin, yPosition)
          yPosition += 5
          
          if (yPosition > pageHeight - 40) {
            pdf.addPage()
            yPosition = margin
          }
        })
      }

      // ===== FOOTER =====
      yPosition = pageHeight - 25
      pdf.setDrawColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      pdf.setLineWidth(1)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      
      yPosition += 6
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(80, 80, 80)
      pdf.text('support@oneinsurance.ph  |  +63 (2) 8123-4567  |  www.oneinsurance.ph', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 4
      pdf.text('This is an official policy certificate issued by One Insurance Company.', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 4
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' })
      
      const fileName = `Policy_Certificate_${policyDetails?.CarrierPolicyNo || 'N/A'}.pdf`
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

  // Calculate coverage duration
  const getCoverageDuration = () => {
    if (!policyDetails?.EffectiveDate || !policyDetails?.ExpiryDate) return null
    const startDate = new Date(policyDetails.EffectiveDate)
    const endDate = new Date(policyDetails.ExpiryDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`
  }

  const CollapsibleSection = ({ 
    section, 
    title, 
    icon: Icon, 
    badge,
    children 
  }: { 
    section: keyof typeof expandedSections
    title: string
    icon: any
    badge?: React.ReactNode
    children: React.ReactNode 
  }) => (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => toggleSection(section)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span>{title}</span>
            {badge}
          </CardTitle>
          {expandedSections[section] ? 
            <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          }
        </div>
      </CardHeader>
      {expandedSections[section] && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#B8960C] to-[#8B6914] text-white shadow-lg rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="shrink-0 text-white hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {policyDetails?.CarrierPolicyNo || 'N/A'}
                  </h1>
                  <Badge className={`${getStatusColor(policyData.status)} shadow-sm`}>
                    {getStatusIcon(policyData.status)}
                    <span className="ml-1">{policyData.status}</span>
                  </Badge>
                </div>
                <p className="text-blue-100 text-sm sm:text-base">
                  {policyDetails?.ProductName || 'Travel Insurance'}
                </p>
                {/* <p className="text-blue-200/80 text-xs sm:text-sm mt-1">
                  Agent: {user?.name ? toTitleCase(user.name) : 'N/A'} • {policyData.agent_code_used?.toUpperCase()}
                </p> */}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleDownloadCertificate}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button 
                size="sm" 
                onClick={handlePrintPolicy}
                className="bg-white text-blue-700 hover:bg-blue-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Premium</p>
                  <p className="text-lg font-bold truncate">
                    {policyDetails?.DuePremium 
                      ? `₱${Number(policyDetails.DuePremium).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(policyDetails?.SumInsured != null && Number(policyDetails.SumInsured) !== 0) && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Coverage</p>
                    <p className="text-lg font-bold truncate">₱{policyDetails.SumInsured.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-lg font-bold truncate">{getCoverageDuration() || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Travellers</p>
                  <p className="text-lg font-bold truncate">
                    {policyDetails?.NoOfTravellers ? String(policyDetails.NoOfTravellers) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
          
            {/* Technical Details - Collapsible */}
            <CollapsibleSection section="technical" title="Policy Details" icon={Building}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Policy Number</p>
                  <p className="font-mono font-semibold">{policyDetails?.CarrierPolicyNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Plan Code</p>
                  <p className="font-mono font-semibold">{policyDetails?.PlanCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Carrier</p>
                  <p className="font-semibold">{policyDetails?.CarrierCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Product Code</p>
                  <p className="font-mono font-semibold">{policyDetails?.ProductCode || policyData.carrier_product_code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Renewable</p>
                  <Badge variant={policyDetails?.IsRenewable === 'Y' ? 'default' : 'secondary'}>
                    {policyDetails?.IsRenewable === 'Y' ? 'Yes' : policyDetails?.IsRenewable === 'N' ? 'No' : 'N/A'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium">{new Date(policyData.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Coverage Period */}
            {(policyDetails?.EffectiveDate && policyDetails?.ExpiryDate) && (
              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        Effective Date
                      </div>
                      <p className="text-2xl font-bold text-primary">
                          {new Date(policyDetails.EffectiveDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        Expiry Date
                      </div>
                      <p className="text-2xl font-bold text-primary">
                          {new Date(policyDetails.ExpiryDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

          {/* Policy Holder - Collapsible */}
          <CollapsibleSection section="policyHolder" title="Policy Holder" icon={User}>
            {customer ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <p className="text-2xl font-bold">
                    {([customer.FirstName, customer.MiddleName, customer.LastName, customer.Suffix]
                      .filter(Boolean)
                      .join(' ') || 'N/A').toUpperCase()}
                  </p>
                </div>

                <Separator />

                {/* Contact Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{customer.Email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{customer.TempData?.['MaskAfter-Mobile'] || customer.Mobile || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {customer.DateOfBirth ? 
                          new Date(customer.DateOfBirth).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Age & Gender</p>
                      <p className="font-medium">
                        {customer.DateOfBirth ? 
                          Math.floor((new Date().getTime() - new Date(customer.DateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' yrs'
                          : 'N/A'
                        }
                        {' • '}
                        {customer.Gender === 'M' ? 'Male' : customer.Gender === 'F' ? 'Female' : customer.Gender || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                    <p className="font-medium leading-relaxed">
                      {[
                        customer.AddressLine1,
                        customer.AddressLine2,
                        getCityNameByCityCode(customer.City) || customer.City,
                        getProvinceNameByProvCode(customer.AddrProvince) || customer.AddrProvince,
                        customer.PostCode
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* ID */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">ID Type</p>
                      <p className="font-medium">
                        {customer.IdTypeCode === 'PAS' ? "Passport" : 
                         customer.IdTypeCode === 'DL' ? "Driver's License" :
                         customer.IdTypeCode === 'NID' ? "National ID" :
                         customer.IdTypeCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">ID Number</p>
                      <p className="font-medium font-mono">
                        {customer.TempData?.['MaskAfter-IdNo'] || customer.IdNo || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No policy holder information available</p>
              </div>
            )}
          </CollapsibleSection>

          {/* Travel Information - Collapsible */}
          <CollapsibleSection section="travel" title="Travel Details" icon={Plane}>
            {travelDetailsList.length > 0 ? (
              <div className="space-y-4">
                {/* Route */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">From</p>
                      <p className="font-bold text-xl">{travelDetails?.PlaceOfOrgin || 'N/A'}</p>
                    </div>
                    <Plane className="h-6 w-6 text-muted-foreground rotate-90" />
                    <div className="flex-1 text-right">
                      <p className="text-xs text-muted-foreground mb-1">To</p>
                      <p className="font-bold text-xl">
                        {travelDetailsList.map((detail: any) => detail.TravelCountry).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Coverage Area</p>
                    <p className="font-semibold">{travelDetails?.TravelCoverageArea || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Travel Type</p>
                    <p className="font-semibold">{policyDetails?.TravelType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trip Type</p>
                    <p className="font-semibold">{policyDetails?.TripType || 'N/A'}</p>
                  </div>
                  {(policyDetails?.NoOfAdults != null && policyDetails?.NoOfChildren != null) && (
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-xs text-muted-foreground mb-1">Traveller Breakdown</p>
                      <p className="font-semibold">
                        {policyDetails.NoOfAdults} Adult{policyDetails.NoOfAdults !== 1 ? 's' : ''}
                        {Number(policyDetails.NoOfChildren) > 0 && `, ${policyDetails.NoOfChildren} Child${policyDetails.NoOfChildren !== 1 ? 'ren' : ''}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 border rounded-lg p-6">
                <p className="text-sm leading-relaxed">
                  This policy provides comprehensive travel insurance coverage including medical emergencies, 
                  trip disruptions, baggage protection, and 24/7 emergency assistance.
                </p>
              </div>
            )}
          </CollapsibleSection>

          {/* Coverage - Collapsible */}
          <CollapsibleSection 
            section="coverage" 
            title="Policy Risk List" 
            icon={Shield}
            badge={
              policyDetails && policyDetails.PolicyLobList?.[0]?.PolicyRiskList?.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {policyDetails.PolicyLobList[0].PolicyRiskList.length}
                </Badge>
              )
            }
          >
            {policyDetails && policyDetails.PolicyLobList?.[0]?.PolicyRiskList?.length > 0 ? (
              <div className="space-y-6">
                {policyDetails.PolicyLobList[0].PolicyRiskList.map((insuredPerson: any, index: number) => (
                  <div key={`insured-${index}`} className="space-y-3">
                    {/* Person Header */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">
                          {insuredPerson.InsuredName || 
                           [insuredPerson.FirstName, insuredPerson.MiddleName, insuredPerson.LastName]
                             .filter(Boolean).join(' ') || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {insuredPerson.IsAdultTraveller === 'Y' ? 'Adult' : 'Child'} • {insuredPerson.Age || 'N/A'} years
                        </p>
                      </div>
                      {insuredPerson.IsMainInsured === 'Y' && (
                        <Badge>Main</Badge>
                      )}
                    </div>

                    {/* Coverage List */}
                    {insuredPerson.PolicyCoverageList && insuredPerson.PolicyCoverageList.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Coverage & Benefits
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {insuredPerson.PolicyCoverageList.map((coverage: any, coverageIndex: number) => (
                          <div 
                            key={`coverage-${index}-${coverageIndex}`} 
                            className="flex items-start gap-2 p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span className="text-sm font-medium leading-tight">{coverage.CoverageName}</span>
                          </div>
                        ))}
                      </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {['Medical Coverage', 'Trip Protection', 'Baggage Protection', '24/7 Assistance'].map(benefit => (
                  <div key={benefit} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Beneficiaries - Collapsible */}
          {policyDetails?.NomineeList && policyDetails.NomineeList.length > 0 && (
            <CollapsibleSection 
              section="beneficiaries" 
              title="Beneficiaries" 
              icon={Users}
              badge={<Badge variant="secondary" className="ml-2">{policyDetails.NomineeList.length}</Badge>}
            >
              <div className="space-y-3">
                {policyDetails.NomineeList.map((beneficiary: any, index: number) => (
                  <div key={`beneficiary-${index}`} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="font-semibold">
                          {([beneficiary.FirstName, beneficiary.MiddleName, beneficiary.LastName]
                            .filter(Boolean)
                            .join(' ') || 'N/A').toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Relationship</p>
                        <p className="font-semibold">{beneficiary.Relationship || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Share</p>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {beneficiary.SharePercent}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Payment Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-1">Total Amount Paid</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {policyData.amount 
                      ? `₱${Number(policyData.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`
                      : '₱0.00'
                    }
                  </p>
                </div>
              
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Transaction Reference</p>
                    <p className="font-mono text-xs font-medium bg-slate-100 p-2 rounded break-all">
                      {policyData.merchant_transaction_id || 'N/A'}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </span>
                    <span className="font-semibold">
                      {policyData.transaction_date 
                        ? new Date(policyData.transaction_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Method
                    </span>
                    <span className="font-semibold">{policyData.payment_brand || 'N/A'}</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payor Details</p>
                  <p className="font-semibold">
                    {customer 
                      ? ([customer.FirstName, customer.MiddleName, customer.LastName]
                          .filter(Boolean)
                          .join(' ') || 'N/A').toUpperCase()
                      : transactionCustomerName 
                      ? transactionCustomerName.toUpperCase()
                      : 'N/A'
                    }
                  </p>
                  {customer?.Email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{customer.Email}</span>
                    </div>
                  )}
                  {customer?.Mobile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{customer.TempData?.['MaskAfter-Mobile'] || customer.Mobile}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Commission Card */}
            <Card className="border shadow-sm overflow-hidden">
              <div className="bg-[#FEF9E7] border-b p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-[#B8960C]" />
                  <h3 className="font-semibold text-[#8B6914]">Commission</h3>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#B8960C] mb-1">Net Commission</p>
                  <p className="text-3xl font-bold text-[#8B6914]">
                    {policyData.commission_log?.agent_commission 
                      ? `₱${Number(policyData.commission_log.agent_commission).toLocaleString()}`
                      : '₱0.00'
                    }
                  </p>
                </div>
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agent</span>
                  <span className="font-semibold">{user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Code</span>
                  <span className="font-mono font-semibold">{policyData.agent_code_used?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-semibold text-right">{policyDetails?.ProductName || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Promo Card */}
            {promoCode && (
              <Card className="border shadow-sm overflow-hidden">
                <div className="bg-purple-50 border-b p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Discount Applied</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700 mb-2">Promo Code</p>
                    <p className="text-2xl font-bold text-purple-900 font-mono mb-3">{promoCode.PromoCode}</p>
                    <Badge className="bg-purple-600 text-white text-lg px-4 py-1.5">
                      {promoCode.DiscountPercent}% OFF
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}