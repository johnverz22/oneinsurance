'use client'

import { format } from 'date-fns'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import {
  IssueQuoteResponse,
  FullQuoteResponse,
  PolicyCoverage,
  TravelPolicyData,
} from '@/types/travel-insurance/policy-types'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { transformToCOCData } from '@/utils/travel-summary-helpers'
import { differenceInDays } from 'date-fns'
import { CoverageOptionFormData } from '@/types/travel-insurance/travel-insurance-request'
import { COMPANIES } from '@/constants/companies'

import { GenerateAndDownloadCoverNote } from '../travel-insurance/coverage-of-confirmation-renderer'

interface coverNoteProps {
  policyData: TravelPolicyData | null | undefined
  quoteData: FullQuoteResponse['data']
}

export type Coverage = {
  coverageName: string
  sumInsured: string | number
}

// Add a utility function to map PolicyCoverageList to Coverage
function mapPolicyCoverageListToCoverage(policyCoverageList: PolicyCoverage[]) {
  return policyCoverageList.map((coverage) => ({
    coverageName: coverage.CoverageName,
    sumInsured: 'Included',
  }))
}

// Add a utility function to map selectedPlan benefits to Coverage
function mapSelectedPlanToCoverage(coverageOption: CoverageOptionFormData) {
  const selectedPlan = coverageOption.selectedPlan
  if (!selectedPlan || !selectedPlan.MainBenefits) return []

  const coverageList: Coverage[] = selectedPlan.MainBenefits.map((benefit) => ({
    coverageName: benefit.BenefitDesc ?? benefit.CoverageName ?? '',
    sumInsured: benefit.Silimit || 'Included',
  }))

  coverageOption.selectedAddonBenefits?.forEach((addonCode) => {
    const addonBenefit = selectedPlan.AddonBenefits.find(
      (benefit) => benefit.BenefitCode === addonCode
    )
    if (addonBenefit) {
      coverageList.push({
        coverageName:
          addonBenefit.BenefitDesc ?? addonBenefit.CoverageName ?? '',
        sumInsured: addonBenefit.Silimit || 'Included',
      })
    }
  })

  return coverageList
}

export function CoverageOfConfirmation({
  policyData,
  quoteData,
}: coverNoteProps) {
  const { coverageOption, travelersInfo } = useTravelInsuranceStore()
  const carrierName = COMPANIES.find(c => c.carrierCode === (quoteData.CarrierCode || coverageOption.carrierCode))?.companyName || quoteData.CarrierCode || ''

  if (quoteData.PolicyCustomerList) {
    quoteData.PolicyCustomerList = quoteData.PolicyCustomerList.map(
      (customer, index) => ({
        ...customer,
        Mobile: travelersInfo[index]?.mobileNumber,
      })
    )
  }

  // Map PolicyCoverageList or fallback to selectedPlan
  const coverageList = quoteData.PolicyLobList?.[0]?.PolicyRiskList?.[0]
    ?.PolicyCoverageList
    ? mapPolicyCoverageListToCoverage(
        quoteData.PolicyLobList[0].PolicyRiskList[0].PolicyCoverageList
      )
    : mapSelectedPlanToCoverage(coverageOption)

  const COC_DATA = transformToCOCData(
    policyData,
    quoteData,
    coverageList,
    coverageOption
  )

  const destinations =
    quoteData.TravelDetailList && quoteData.TravelDetailList.length > 0
      ? quoteData.TravelDetailList.map((travel: any) => {
          return travel.PlaceOfOrgin && travel.TravelCountry
            ? `${travel.PlaceOfOrgin} → ${travel.TravelCountry}`
            : travel.TravelCountry || 'Not specified'
        }).join(', ')
      : 'Not specified'

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-start justify-between border-b p-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Cover Note
              </h1>
              <p className="text-sm text-muted-foreground">
                #{(typeof window !== 'undefined' ? localStorage.getItem('payment_transaction_id') : null) || policyData?.CarrierPolicyNo || 'N/A'}
              </p>
            </div>

            <div className="relative h-16 w-40">
              <Image
                src="/images/IFRC.png"
                alt="IFRC logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="grid gap-8 border-b p-8 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Policy Number</p>
              <p className="mt-1 text-sm text-foreground">
                {policyData?.CarrierPolicyNo || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Insurance Provider</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {carrierName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Plan Name</p>
              <p className="mt-1 text-sm text-foreground">
                {coverageOption.selectedPlan?.CarrierPlanDesc ||
                  quoteData.CarrierPlanCode}
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-b p-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Issued To
              </p>
              <div className="text-sm">
                {quoteData.PolicyCustomerList?.map((customer, i) => (
                  <div key={i} className="mb-2">
                    <p className="font-bold text-foreground">
                      {(customer.FirstName + ' ' + customer.LastName).toUpperCase()}
                    </p>
                    <p className="text-muted-foreground">{customer.AddressLine1}</p>
                    <p className="text-muted-foreground">{customer.AddressLine2}</p>
                    <p className="text-muted-foreground">{customer.PostCode}</p>
                    <p className="text-muted-foreground">{customer.Email}</p>
                    <p className="text-muted-foreground">
                      (+63) {travelersInfo[i].mobileNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Travel Details
              </p>
              <div className="text-sm text-foreground">
                <p>
                  <span className="font-semibold">Destination/s:</span>{' '}
                  {destinations}
                </p>
                <p>
                  <span className="font-semibold">Travel Type:</span>{' '}
                  {quoteData.TravelType || 'Individual'}
                </p>
                <p>
                  <span className="font-semibold">Duration:</span>{' '}
                  {differenceInDays(
                    new Date(quoteData.ExpiryDate),
                    new Date(quoteData.EffectiveDate)
                  ) + 1}{' '}
                  days
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Coverage Name
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Sum Insured
                  </th>
                </tr>
              </thead>
              <tbody>
                {coverageList.map((coverage, index) => (
                  <tr
                    key={index}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="py-4 text-sm font-medium text-foreground">
                      {coverage.coverageName}
                    </td>
                    <td className="py-4 text-right text-sm text-muted-foreground">
                      {!isNaN(Number(coverage.sumInsured))
                        ? `${coverage.sumInsured.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : coverage.sumInsured}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-xs text-muted-foreground italic">
              Note: Benefits are subject to the terms and conditions of the
              policy. Please ensure your travel coverage is valid within the
              period stated below.
            </p>
          </div>

          <div className="bg-muted/50 p-8">
            <h3 className="mb-4 text-xs font-bold tracking-wide text-foreground uppercase">
              Policy Details
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  Active
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Issue Date</p>
                <p className="mt-1 text-sm text-foreground">
                  {format(new Date(), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Coverage Period
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {format(new Date(quoteData.EffectiveDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(quoteData.ExpiryDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/50 p-6 text-center">
            <p className="text-sm text-muted-foreground italic">
              Thank you for choosing One Insurance. Stay protected and travel
              with confidence!
            </p>
          </div>

          <div className="flex gap-4 border-t bg-muted/50 p-8">
            <GenerateAndDownloadCoverNote cocData={COC_DATA} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
