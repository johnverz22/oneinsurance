'use client'

import { format } from 'date-fns'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import {
  IssueQuoteResponse,
  FullQuoteResponse,
} from '@/types/travel-insurance/policy-types'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { transformToCOCData } from '@/utils/travel-summary-helpers'
import { GenerateAndDownloadCoverNote } from '../travel-insurance/coverage-of-confirmation-renderer'
import { differenceInDays } from 'date-fns'

interface coverNoteProps {
  policyData: IssueQuoteResponse['data']
  quoteData: FullQuoteResponse['data']
}

export function CoverageOfConfirmation({
  policyData,
  quoteData,
}: coverNoteProps) {
  const { coverageOption, travelersInfo } = useTravelInsuranceStore()

  if (quoteData.PolicyCustomerList) {
    quoteData.PolicyCustomerList = quoteData.PolicyCustomerList.map(
      (customer, index) => ({
        ...customer,
        Mobile: travelersInfo[index]?.mobileNumber,
      })
    )
  }

  console.info('quoteData with mobile numbers:', quoteData)

  const COC_DATA = transformToCOCData(policyData, quoteData, coverageOption)

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
              <h1 className="text-3xl font-bold text-gray-800">
                Confirmation of Coverage
              </h1>
              <p className="text-sm text-gray-600">
                #{policyData.PolicyNo || 'PQTRAVEL001'}
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

          <div className="grid gap-8 border-b p-8 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500">Policy Number</p>
              <p className="mt-1 text-sm text-gray-800">
                {policyData.PolicyNo}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Plan Name</p>
              <p className="mt-1 text-sm text-gray-800">
                {coverageOption.selectedPlan?.CarrierPlanDesc ||
                  quoteData.CarrierPlanCode}
              </p>
            </div>
          </div>

          <div className="grid gap-8 border-b p-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium text-gray-500">
                Issued To
              </p>
              <div className="text-sm">
                {quoteData.PolicyCustomerList?.map((customer, i) => (
                  <div key={i} className="mb-2">
                    <p className="font-bold text-gray-800">
                      {customer.FirstName} {customer.LastName}
                    </p>
                    <p className="text-gray-600">{customer.AddressLine1}</p>
                    <p className="text-gray-600">{customer.City}</p>
                    <p className="text-gray-600">{customer.Email}</p>
                    <p className="text-gray-600">
                      (+63) {travelersInfo[i].mobileNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-gray-500">
                Travel Details
              </p>
              <div className="text-sm text-gray-800">
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
                  <th className="pb-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Coverage Name
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    Sum Insured
                  </th>
                </tr>
              </thead>
              <tbody>
                {quoteData.PolicyLobList?.[0]?.PolicyRiskList?.[0]?.PolicyCoverageList?.map(
                  (coverage, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="py-4 text-sm font-medium text-gray-800">
                        {coverage.CoverageName}
                      </td>
                      <td className="py-4 text-right text-sm text-gray-600">
                        {'Included'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            <p className="mt-4 text-xs text-gray-500 italic">
              Note: Benefits are subject to the terms and conditions of the
              policy. Please ensure your travel coverage is valid within the
              period stated below.
            </p>
          </div>

          <div className="bg-gray-50 p-8">
            <h3 className="mb-4 text-xs font-bold tracking-wide text-gray-700 uppercase">
              Policy Details
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600">
                  Active
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Issue Date</p>
                <p className="mt-1 text-sm text-gray-800">
                  {format(new Date(), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Coverage Period
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {format(new Date(quoteData.EffectiveDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(quoteData.ExpiryDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600 italic">
              Thank you for choosing One Insurance. Stay protected and travel
              with confidence!
            </p>
          </div>

          <div className="flex gap-4 border-t bg-gray-50 p-8">
            <GenerateAndDownloadCoverNote cocData={COC_DATA} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
