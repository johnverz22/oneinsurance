'use client'

import { format } from 'date-fns'
import { DocumentPanel, DocSection, DocField, DocFieldGrid } from './document-preview'
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
  paymentReference?: string
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
  paymentReference,
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

  const days = differenceInDays(new Date(quoteData.ExpiryDate), new Date(quoteData.EffectiveDate)) + 1
  const period = `${format(new Date(quoteData.EffectiveDate), 'MMM dd, yyyy')} – ${format(new Date(quoteData.ExpiryDate), 'MMM dd, yyyy')}`

  return (
    <div className="space-y-4">
      <DocumentPanel>
        <DocSection title="Policy">
          <DocFieldGrid>
            <DocField label="Policy Number">{policyData?.CarrierPolicyNo || 'Pending'}</DocField>
            <DocField label="Insurance Provider">{carrierName}</DocField>
            <DocField label="Plan Name">{coverageOption.selectedPlan?.CarrierPlanDesc || quoteData.CarrierPlanCode}</DocField>
            <DocField label="Status">
              <span className="text-success">Active</span>
            </DocField>
          </DocFieldGrid>
        </DocSection>

        <DocSection title="Issued To">
          <div className="space-y-3">
            {COC_DATA.customers.map((customer, i) => (
              <div key={i} className="text-sm">
                <p className="text-foreground font-semibold">{customer.name}</p>
                <p className="text-muted-foreground break-words">{customer.address}</p>
                <p className="text-muted-foreground break-all">{customer.email}</p>
                <p className="text-muted-foreground">(+63) {customer.phone}</p>
              </div>
            ))}
          </div>
        </DocSection>

        <DocSection title="Travel Details">
          <DocFieldGrid>
            <DocField label="Destination/s" className="sm:col-span-2">
              {destinations}
            </DocField>
            <DocField label="Travel Type">{quoteData.TravelType || 'Individual'}</DocField>
            <DocField label="Duration">
              {days} {days === 1 ? 'day' : 'days'}
            </DocField>
            <DocField label="Coverage Period" className="sm:col-span-2">
              {period}
            </DocField>
          </DocFieldGrid>
        </DocSection>

        <DocSection title="Coverage Details">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-xs">
                <th className="pb-2 text-left font-medium">Coverage Name</th>
                <th className="pb-2 text-right font-medium">Sum Insured</th>
              </tr>
            </thead>
            <tbody>
              {coverageList.map((coverage, index) => (
                <tr key={index} className="border-border border-b last:border-b-0">
                  <td className="text-foreground py-2.5 pr-4 font-medium">{coverage.coverageName}</td>
                  <td className="text-muted-foreground py-2.5 text-right">
                    {!isNaN(Number(coverage.sumInsured))
                      ? Number(coverage.sumInsured).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : coverage.sumInsured}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-muted-foreground text-xs">
            Benefits are subject to the terms and conditions of the policy.
          </p>
        </DocSection>
      </DocumentPanel>

      <GenerateAndDownloadCoverNote cocData={COC_DATA} paymentReference={paymentReference} />
    </div>
  )
}
