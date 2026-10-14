'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { COMPANIES } from '@/constants/companies'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TravelDetailsSummary() {
  const { travelDetails, coverageOption, travelersInfo, step } = useTravelInsuranceStore()
  const { apiResponse } = useFullQuoteResponseStore()
  const { agentCode } = useAgentCodeStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDownloadPDF = () => {
    try {
      if (!apiResponse?.data) {
        toast.error('Quote data not available')
        return
      }

      // Get provider name
      const provider = COMPANIES.find(
        (c) => c.carrierCode === coverageOption.carrierCode
      )

      // Get plan name
      const planName = coverageOption.selectedPlan?.CarrierPlanDesc

      // Get addon names
      const addons = coverageOption.selectedAddonBenefits?.map((addonCode) => {
        // Find the addon benefit description
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

  return (
    <div className="space-y-4">
      <Card className="bg-background overflow-hidden p-0 shadow-none">
        <CardHeader
          className={cn(
            "flex items-center justify-between cursor-pointer lg:cursor-default",
            !isExpanded ? "py-4 sm:py-6" : "pt-4 pb-2 sm:pt-6"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-primary text-lg sm:text-2xl font-bold">Your Travel Details</h2>
            <CheckCircle className="text-primary dark:text-accent h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <button className="lg:hidden text-muted-foreground" type="button">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </CardHeader>
        <CardContent className={cn(
          'grid gap-3 px-6 pb-4 sm:gap-8 sm:pb-6 lg:grid-cols-3',
          { 'hidden lg:grid': !isExpanded }
        )}>
          <div className="space-y-2 sm:space-y-4">
            <div className="space-y-0.5 sm:space-y-2 sm:py-1">
              <p className="text-xs sm:text-sm font-medium text-foreground dark:text-muted-foreground">
                From
              </p>
              <p className="text-primary dark:text-accent text-sm sm:text-base font-bold whitespace-nowrap">
                {travelDetails.travelDetailList[0].PlaceOfOrgin}
              </p>
            </div>
            <div className="space-y-0.5 sm:space-y-2 sm:py-1">
              <p className="text-xs sm:text-sm font-medium text-foreground dark:text-muted-foreground">
                To
              </p>
              {travelDetails.travelDetailList.map((detail) => (
                <div
                  key={detail.TravelCountry}
                  className="flex items-center gap-2"
                >
                  <div className="bg-primary/30 dark:bg-accent/30 flex size-5 sm:size-6 items-center justify-center rounded-full text-center text-xs sm:text-sm">
                    {detail.DisplaySequence}
                  </div>
                  <p className="text-primary dark:text-accent text-sm sm:text-base font-bold whitespace-nowrap">
                    {detail.TravelCountry}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4">
            <div className="space-y-0.5 sm:space-y-2 sm:py-1">
              <p className="text-xs sm:text-sm font-medium text-foreground dark:text-muted-foreground">
                Departure Date
              </p>
              <p className="text-primary dark:text-accent text-sm sm:text-base font-bold whitespace-nowrap">
                {format(travelDetails.departureDate, 'PP')}
              </p>
            </div>
            <div className="space-y-0.5 sm:space-y-2 sm:py-1">
              <p className="text-xs sm:text-sm font-medium text-foreground dark:text-muted-foreground">
                Return Date
              </p>
              <p className="text-primary dark:text-accent text-sm sm:text-base font-bold whitespace-nowrap">
                {format(travelDetails.returnDate!, 'PP')}
              </p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-4">
            <div className="space-y-0.5 sm:space-y-2 sm:py-1">
              <p className="text-xs sm:text-sm font-medium text-foreground dark:text-muted-foreground">
                No. Of Travellers
              </p>
              <p className="text-primary dark:text-accent text-sm sm:text-base font-bold whitespace-nowrap">
                {travelDetails.noOfAdults} Adults, {travelDetails.noOfChildren}{' '}
                Children
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
