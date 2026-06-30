'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle,
  Edit2,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Shield,
  Plane,
  Download,
} from 'lucide-react'
import {
  useTravelInsuranceStore,
  useFullQuoteResponseStore,
} from '@/store/travel-insurance-store'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getIdNameByIdType } from '@/utils/travel-coverages-helpers'
import { useFullQuoteRequest } from '@/app/data/mutations/full-quote-request'
import { mapTravelInsuranceStoreToFullQuoteRequest } from '@/utils/travel-insurance-mapper'
import { FullQuoteResponseValidationErrorSchema } from '@/types/travel-insurance/error-travel-response'
import {
  FullQuoteResponse,
  FullQuoteResponseSchema,
} from '@/types/travel-insurance/policy-types'
import { useState, useEffect } from 'react'
import { TravelDetailsSummary } from './travel-details-summary'
import {
  getHighlightedBenefits,
  groupBenefits,
  groupPlanBenefits,
} from '@/utils/travel-benefits-helpers'
import { COMPANIES, CARRIER_BRAND_COLORS } from '@/constants/companies'
import Image from 'next/image'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useSignInStateStore } from '@/store/signin-store'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { toast } from 'sonner'

export function TravelInsuranceReviewPage() {
  const { travelersInfo, coverageOption, nextStep, prevStep, travelDetails, isLoadingProposal } =
    useTravelInsuranceStore()
  const { apiResponse } = useFullQuoteResponseStore()
  const { agentCode } = useAgentCodeStore()
  const [proceedingToPayment, setProceedingToPayment] = useState(false)
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)

  // Check if we're in read-only mode (loaded from proposal search)
  useEffect(() => {
    const readOnlyMode = sessionStorage.getItem('proposal-readonly-mode')
    if (readOnlyMode === 'true') {
      setIsReadOnlyMode(true)
      console.log('📋 Review page loaded in read-only mode (from proposal search)')
      console.log('📋 Using data from load-quote API only')
    }
  }, [])

  const handleDownloadPDF = () => {
    try {
      if (!apiResponse?.data) {
        toast.error('No quote data available')
        return
      }

      const destinations = apiResponse.data.TravelDetailList?.map((detail: any) => ({
        country: detail.TravelCountry,
        coverageArea: detail.TravelCoverageArea,
      })).filter(Boolean) || []

      // Get provider name
      const provider = COMPANIES.find(
        (c) => c.carrierCode === coverageOption.carrierCode
      )

      // Get plan name
      const planName = coverageOption.selectedPlan?.CarrierPlanDesc

      // Get addon names
      const addons = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        const addon = coverageOption.selectedPlan?.AddonBenefits?.find(
          (benefit) => benefit.BenefitCode === addonCode
        )
        return addon?.BenefitDesc || addonCode
      })

      // Get main benefits
      const mainBenefits = coverageOption.selectedPlan?.MainBenefits || []

      // Get selected addon benefits (full objects)
      const selectedAddonBenefits = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        return coverageOption.selectedPlan?.AddonBenefits?.find(
          (benefit) => benefit.BenefitCode === addonCode
        )
      }).filter(Boolean) || []

      generateQuotePDF({
        travelDetails,
        travelersInfo,
        apiResponse,
        planName,
        providerName: provider?.companyName,
        addons,
        mainBenefits,
        addonBenefits: selectedAddonBenefits as any,
        agentCode: agentCode || undefined,
      })

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleProceedToPayment = async () => {
    nextStep()
  }

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  )
  const plan = coverageOption.selectedPlan
  
  // Show loading state while proposal is being loaded from API
  if (isLoadingProposal || !plan) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading your quote details from backend...</p>
        </div>
      </div>
    )
  }
  
  // If provider is not found after loading, show error message with details
  if (!provider) {
    console.error('❌ Review page error:', {
      hasProvider: !!provider,
      hasPlan: !!plan,
      carrierCode: coverageOption.carrierCode,
      planData: plan,
      isReadOnlyMode,
      apiResponseExists: !!apiResponse?.data
    })
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">
            Provider not found. Please try searching for your proposal again.
          </p>
          <Button
            onClick={() => {
              // Clear all session storage and redirect to main page
              sessionStorage.clear()
              window.location.href = window.location.origin + window.location.pathname.split('/avail')[0]
            }}
            variant="outline"
          >
            Back to Search
          </Button>
        </div>
      </div>
    )
  }
  
  const group = groupBenefits(plan)
  // Show all benefits without limiting
  const allBenefits = group.flatMap((g) => g.benefits)

  // Get selected addon benefits details
  const { groupedAddonBenefits } = groupPlanBenefits(plan)
  const selectedAddonDetails = Object.entries(groupedAddonBenefits)
    .filter(([benefitCode]) =>
      coverageOption.selectedAddonBenefits?.includes(benefitCode)
    )
    .map(([_, benefitGroup]) => benefitGroup)

  const proposalNumber = apiResponse?.data?.ProposalNo

  return (
    <div className="relative space-y-6">
      <div className="space-y-6">
        {/* Proposal Number Card */}
        {proposalNumber && (
          <Card className="bg-background overflow-hidden p-0 shadow-none">
            <CardContent className="flex items-center justify-between px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Proposal Number
              </h3>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 dark:bg-accent/10 px-4 py-2">
                  <p className="text-primary dark:text-accent text-lg font-bold tracking-wider">
                    {proposalNumber}
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      if (navigator?.clipboard?.writeText) {
                        await navigator.clipboard.writeText(proposalNumber)
                        toast.success('Proposal number copied to clipboard')
                      } else {
                        // Fallback for browsers that don't support clipboard API
                        const textArea = document.createElement('textarea')
                        textArea.value = proposalNumber
                        textArea.style.position = 'fixed'
                        textArea.style.left = '-999999px'
                        document.body.appendChild(textArea)
                        textArea.select()
                        try {
                          document.execCommand('copy')
                          toast.success('Proposal number copied to clipboard')
                        } catch (err) {
                          toast.error('Failed to copy proposal number')
                        }
                        document.body.removeChild(textArea)
                      }
                    } catch (error) {
                      console.error('Failed to copy:', error)
                      toast.error('Failed to copy proposal number')
                    }
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <TravelDetailsSummary />

        <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-6">
            <h2 className="text-primary text-lg sm:text-2xl font-bold">Plan Details</h2>
            <Button
              onClick={handleDownloadPDF}
              variant="default"
              size="lg"
              className="from-primary to-accent rounded-full bg-gradient-to-r font-semibold dark:text-white"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Quote PDF
            </Button>
          </CardHeader>
          <CardContent className="h-full w-full space-y-3">
            {/* Provider Information */}
            <div className="flex w-full gap-2">
              <div className="relative h-14 w-28 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={(CARRIER_BRAND_COLORS[provider.carrierCode] as any)?.planCardLogo || provider.image}
                  alt={provider.companyName}
                  className="h-full w-full object-contain"
                  width={112}
                  height={56}
                />
              </div>

              <div className="space-y-2 px-1.5">
                <h3 className="text-foreground text-left text-base sm:text-xl font-bold tracking-wide text-wrap uppercase">
                  {plan.CarrierPlanDesc}
                </h3>
              </div>
            </div>

            {/* Benefits and Add-ons Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Benefits Section */}
              <div className="w-full space-y-3">
                <h2 className="text-primary text-base font-bold">Benefits</h2>
                <ScrollArea className="border-muted-foreground/20 bg-muted/30 h-[300px] w-full rounded-md border p-4">
                  <div className="space-y-2 pr-4">
                    {allBenefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-2 items-center gap-3"
                      >
                        <h4 className="text-sm">{benefit.BenefitDesc}</h4>
                        <small className="text-muted-foreground text-right text-xs">
                          {benefit.DefaultLimitDesc !== '0'
                            ? benefit.DefaultLimitDesc
                            : `Up to ₱${Number.parseFloat(benefit.Silimit ?? '0').toLocaleString('en-PH')}`}
                          <br />
                          {benefit.LimitModeDesc}
                        </small>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Add-ons Section */}
              <div className="w-full space-y-3">
                <h2 className="text-primary text-base font-bold">
                  Travel Add-Ons
                </h2>
                {selectedAddonDetails.length > 0 ? (
                  <ScrollArea className="border-muted-foreground/20 bg-muted/30 h-[300px] w-full rounded-md border p-4 pb-6">
                    <div className="space-y-4 pr-4">
                      {selectedAddonDetails.map((addonGroup, groupIndex) => (
                        <div key={groupIndex} className="space-y-2">
                          <h3 className="text-sm font-semibold">
                            {addonGroup.parent.CoverageName}
                          </h3>
                          <div className="space-y-2">
                            {addonGroup.children.map((addon, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-2 items-center gap-3"
                              >
                                <h4 className="text-sm">{addon.BenefitDesc}</h4>
                                <small className="text-muted-foreground text-right text-xs">
                                  {addon.DefaultLimitDesc
                                    ? addon.DefaultLimitDesc
                                    : `Up to ₱${Number.parseFloat(addon.Silimit ?? '0').toLocaleString('en-PH')}`}
                                  <br />
                                  {addon.LimitModeDesc}
                                </small>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="border-muted-foreground/20 bg-muted/30 flex h-[300px] w-full items-center justify-center rounded-md border">
                    <p className="text-muted-foreground font-semibold">
                      No add-on benefits
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Information Section */}
        <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
          <CardHeader className="flex items-center justify-between -space-y-2 pt-6">
            <h2 className="text-primary text-lg sm:text-2xl font-bold">
              Your information
            </h2>
            <CheckCircle className="dark:text-accent text-primary" />
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Travelers Information */}
            {travelersInfo.map((traveler, index) => (
              <div key={index} className="space-y-4">
                {travelersInfo.length > 1 && (
                  <h4 className="text-primary dark:text-accent border-b pb-2 text-xl font-bold">
                    Traveler {index + 1}
                  </h4>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-primary dark:text-accent mb-1 font-medium">
                        Name
                      </p>
                      <p className="text-foreground font-semibold">
                        {traveler.firstName}{' '}
                        {traveler.middleName && `${traveler.middleName} `}
                        {traveler.lastName}
                        {traveler.suffix &&
                          traveler.suffix !== 'No Suffix' &&
                          `, ${traveler.suffix}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary dark:text-accent mb-1 font-medium">
                        Mobile Number
                      </p>
                      <p className="text-foreground font-semibold">
                        +63{traveler.mobileNumber}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-primary dark:text-accent mb-1 font-medium">
                        Gender
                      </p>
                      <p className="text-foreground font-semibold">
                        {traveler.gender === 'M' ? 'Male' : 'Female'}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary dark:text-accent mb-1 font-medium">
                        Email Address
                      </p>
                      <p className="text-foreground font-semibold">
                        {traveler.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-primary dark:text-accent mb-1 font-medium">
                      ID Type
                    </p>
                    <p className="text-foreground font-semibold">
                      {getIdNameByIdType(traveler.idType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary dark:text-accent mb-1 font-medium">
                      ID Number
                    </p>
                    <p className="text-foreground font-semibold">
                      {traveler.idNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-primary dark:text-accent mb-1 font-medium">
                    Address
                  </p>
                  <p className="text-foreground font-semibold">
                    {traveler.address.line1}
                    {traveler.address.line2 && (
                      <span>, {traveler.address.line2}</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-primary dark:text-accent mb-1 font-medium">
                    Date Of Birth
                  </p>
                  <p className="text-foreground font-semibold">
                    {new Date(traveler.dateOfBirth).toDateString() ||
                      'Not specified'}
                  </p>
                </div>

                {/* Beneficiary display enabled */}
                {true && traveler.beneficiary && traveler.beneficiary.firstName && (
                  <div className="border-t pt-4">
                    <h5 className="text-primary dark:text-accent mb-3 text-lg font-semibold">
                      Beneficiary
                    </h5>
                    <div className="space-y-2 rounded-lg border border-gray-200 p-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Name</p>
                        <p className="font-semibold">
                          {`${traveler.beneficiary.firstName} ${traveler.beneficiary.middleName && traveler.beneficiary.middleName} ${traveler.beneficiary.lastName}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Date of Birth
                        </p>
                        <p className="font-semibold">
                          {traveler.beneficiary.dateOfBirth
                            ? new Date(
                                traveler.beneficiary.dateOfBirth!
                              ).toDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Relationship
                        </p>
                        <p className="font-semibold">
                          {traveler.beneficiary.relationship || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {index < travelersInfo.length - 1 && (
                  <div className="my-6 border-b" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full flex-col items-center gap-3 px-1.5 lg:px-0">
        <div className="flex w-full flex-col items-center gap-3 lg:flex-row lg:justify-between">
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="lg"
            className="w-full rounded-full border-2 font-semibold lg:w-max lg:px-12"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Quote PDF
          </Button>
          
          <div className="hidden w-full flex-col gap-3 lg:flex lg:w-auto lg:flex-row">
            {!isReadOnlyMode && (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full rounded-full bg-transparent px-12 font-semibold lg:w-max"
                onClick={prevStep}
                data-mobile-action="back"
              >
                Back
              </Button>
            )}
            
            <Button
              size="lg"
              className="from-primary to-accent w-full rounded-full bg-gradient-to-r via-90% px-14 font-semibold lg:w-max dark:text-white"
              onClick={async () => {
                setProceedingToPayment(true)
                await handleProceedToPayment()
              }}
              data-mobile-action="next"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {proceedingToPayment ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TravelInsuranceReviewPage
