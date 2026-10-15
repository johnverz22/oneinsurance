'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatDays, formatTravelers, formatTripRange, getTripDays, titleCase } from '@/utils/trip-summary'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, CheckCircle, ChevronDown, ChevronUp, MapPin, Users } from 'lucide-react'
import { generateQuotePDF } from '@/utils/generate-quote-pdf'
import { COMPANIES } from '@/constants/companies'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TravelDetailsSummary() {
  const { travelDetails, coverageOption, travelersInfo, step } = useTravelInsuranceStore()
  const { apiResponse } = useFullQuoteResponseStore()
  const { agentCode } = useAgentCodeStore()
  const router = useRouter()
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
        taxes: {
          premiumTax: coverageOption.selectedPlan?.PremiumTaxAmt,
          stampDuty: coverageOption.selectedPlan?.StampDuty,
        },
      })

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const route = `${titleCase(travelDetails.travelDetailList[0]?.PlaceOfOrgin)} → ${travelDetails.travelDetailList
    .map((d) => titleCase(d.TravelCountry))
    .join(', ')}`
  const travelers = formatTravelers(travelDetails.noOfAdults, travelDetails.noOfChildren)
  const days = formatDays(getTripDays(travelDetails.departureDate, travelDetails.returnDate))
  const summaryLine = `${route} · ${formatTripRange(travelDetails.departureDate, travelDetails.returnDate, true)} · ${travelers}`
  const items = [
    { icon: MapPin, label: 'Trip', value: route },
    {
      icon: CalendarDays,
      label: 'Travel dates',
      value: `${formatTripRange(travelDetails.departureDate, travelDetails.returnDate)} · ${days}`,
    },
    { icon: Users, label: 'Travelers', value: travelers },
  ]

  return (
    <Card className="bg-card overflow-hidden p-0 shadow-none">
      <CardHeader
        className={cn(
          'flex cursor-pointer items-center justify-between gap-3 px-5 sm:px-6',
          isExpanded ? 'pt-5 pb-3' : 'py-4'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-primary text-lg font-semibold sm:text-xl">Your travel details</h2>
            <CheckCircle className="text-success size-4 sm:size-5" />
          </div>
          {!isExpanded && (
            <p className="text-muted-foreground mt-1 truncate text-sm">{summaryLine}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {step <= 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary font-semibold"
              onClick={() => router.push(`/${agentCode}/products/travel-insurance`)}
            >
              Edit
            </Button>
          )}
          <button
            className="text-muted-foreground"
            type="button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </CardHeader>
      <CardContent
        className={cn('grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6 lg:grid-cols-3', {
          'hidden': !isExpanded,
        })}
      >
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-muted/40 border-border flex min-w-0 items-start gap-3 rounded-xl border p-3">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <div className="text-foreground text-sm font-semibold">{value}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
