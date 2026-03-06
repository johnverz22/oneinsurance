'use client'

import { format } from 'date-fns'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download } from 'lucide-react'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { COMPANIES } from '@/constants/companies'
import { toast } from 'sonner'

export function TravelDetailsSummary() {
  const { travelDetails, coverageOption, travelersInfo, step } = useTravelInsuranceStore()
  const { apiResponse } = useFullQuoteResponseStore()

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
        <CardHeader className="flex items-center justify-between -space-y-2 pt-6">
          <h2 className="text-primary text-2xl font-bold">Your Travel Details</h2>
          <CheckCircle className="text-primary dark:text-accent" />
        </CardHeader>
        <CardContent className="grid gap-8 px-6 pb-6 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                From
              </p>
              <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
                {travelDetails.travelDetailList[0].PlaceOfOrgin}
              </p>
            </div>
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To
              </p>
              {travelDetails.travelDetailList.map((detail) => (
                <div
                  key={detail.TravelCountry}
                  className="flex items-center gap-2"
                >
                  <div className="bg-primary/30 dark:bg-accent/30 flex size-6 items-center justify-center rounded-full text-center text-sm">
                    {detail.DisplaySequence}
                  </div>
                  <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
                    {detail.TravelCountry}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Departure Date
              </p>
              <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
                {format(travelDetails.departureDate, 'PP')}
              </p>
            </div>
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Return Date
              </p>
              <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
                {format(travelDetails.returnDate!, 'PP')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 py-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No. Of Travellers
              </p>
              <p className="text-primary dark:text-accent text-base font-bold whitespace-nowrap">
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
