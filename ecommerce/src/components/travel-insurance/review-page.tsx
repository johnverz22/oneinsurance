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
import { useState } from 'react'
import { TravelDetailsSummary } from './travel-details-summary'
import {
  getHighlightedBenefits,
  groupBenefits,
  groupPlanBenefits,
} from '@/utils/travel-benefits-helpers'
import { COMPANIES } from '@/constants/companies'
import Image from 'next/image'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useSignInStateStore } from '@/store/signin-store'

export function TravelInsuranceReviewPage() {
  const { travelersInfo, coverageOption, nextStep, prevStep } =
    useTravelInsuranceStore()
  const [proceedingToPayment, setProceedingToPayment] = useState(false)

  const handleProceedToPayment = async () => {
    nextStep()
  }

  const provider = COMPANIES.find(
    (c) => c.carrierCode === coverageOption.carrierCode
  )!
  const plan = coverageOption.selectedPlan!
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

  return (
    <div className="relative space-y-6">
      <div className="space-y-6">
        <TravelDetailsSummary />

        <Card className="bg-background overflow-hidden p-0 pb-8 shadow-none">
          <CardHeader className="flex items-center justify-between -space-y-2 pt-6">
            <h2 className="text-primary text-2xl font-bold">Plan Details</h2>
            <CheckCircle className="dark:text-accent text-primary" />
          </CardHeader>
          <CardContent className="h-full w-full space-y-3">
            {/* Provider Information */}
            <div className="flex w-full gap-2">
              <div className="border-muted-foreground/10 relative flex h-20 w-32 shrink-0 items-center justify-center rounded-md border bg-white px-3 py-6">
                <Image
                  src={provider.image}
                  alt={provider.companyName}
                  className="rounded-lg"
                  width={640}
                  height={640}
                />
              </div>

              <div className="space-y-2 px-1.5">
                <Badge variant="outline" className="h-max w-max">
                  {provider?.companyName}
                </Badge>
                <h3 className="text-foreground text-left text-xl font-bold tracking-wide text-wrap uppercase">
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
                            : `Up to ₱${Number.parseFloat(benefit.Silimit ?? '0').toLocaleString()}`}
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
                                    : `Up to ₱${Number.parseFloat(addon.Silimit ?? '0').toLocaleString()}`}
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
            <h2 className="text-primary text-2xl font-bold">
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

      <div className="flex w-full items-center justify-center gap-3 px-1.5 lg:justify-start lg:px-0">
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-1/2 rounded-full bg-transparent px-12 font-semibold lg:w-max"
          onClick={prevStep}
        >
          Back
        </Button>
        <Button
          size="lg"
          className="from-primary to-accent w-1/2 rounded-full bg-gradient-to-r via-90% px-14 lg:w-max dark:text-white"
          onClick={async () => {
            setProceedingToPayment(true)
            await handleProceedToPayment()
          }}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {proceedingToPayment ? 'Processing...' : 'Proceed to Payment'}
        </Button>
      </div>
    </div>
  )
}

export default TravelInsuranceReviewPage
