'use client'

import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/page-loader'
import VehicleRegistration from '@/components/ctpl-insurance/vehicle-registration-page'
import PersonalInformationPage from '@/components/ctpl-insurance/personal-info-page'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CTPLPeriodForm from '@/components/ctpl-insurance/insurance-period-form'
import { useIdleService } from '@/utils/use-idle-service'
import { useRouter } from 'next/navigation'
import { CTPLCoverageOptionsForm } from '@/components/ctpl-insurance/coverage-option'
import { useGetCtplCompareQuote } from '@/app/data/queries/ctpl-insurance'
import { CtplPlanCard } from '@/components/ctpl-insurance/plan-card'
import { Stepper } from '@/components/ui/stepper'
import ReviewCoverage from '@/components/ctpl-insurance/review-page'

export default function CTPLAvailPage() {
  const {
    step,
    highestVisitedStep,
    clientRequestId,
    coverageOption,
    selectedVehicle,
    duration,
    increaseStep,
    updateCoverageOption,
    setHighestVisitedStep,
  } = useCtplInsuranceStateStore()
  const [hydrated, setHydrated] = useState(false)
  const router = useRouter()

  useIdleService('ctpl-insurance-storage', 15, () => {
    alert('Session expired due to inactivity.')
    router.push('/products/ctpl-insurance')
  })

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && (!duration || !duration.duration)) {
      router.push('/products/ctpl-insurance')
    }
  }, [hydrated, duration, router])

  if (!hydrated || !duration || !duration.duration) return <PageLoader />

  const steps = [
    {
      title: 'Vehicle Registration',
      description:
        'Enter your vehicle details to verify registration and eligibility.',
      component: <VehicleRegistration />,
    },
    {
      title: 'Personal Information',
      description: 'Provide your personal details for policy documentation.',
      component: <PersonalInformationPage />,
    },
    {
      title: 'Coverage Options',
      description:
        'Select the CTPL insurance type and coverage period that suits you.',
      component: (
        <CTPLCoverageOptionsForm
          clientRequestId={clientRequestId}
          coverageOption={coverageOption}
          increaseStep={increaseStep}
          updateCoverageOption={updateCoverageOption}
          useGetCompareQuote={(clientRequestId: string) =>
            useGetCtplCompareQuote(clientRequestId, selectedVehicle.code)
          }
        />
      ),
    },
    {
      title: 'Review Selected Plan',
      description:
        'Review your selected CTPL insurance plan and coverage details.',
      component: <ReviewCoverage />,
    },
  ]

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10">
      <div className="relative grid min-h-[100vh] w-full gap-3 lg:grid-cols-4">
        <div className="col-span-1">
          <div className="space-y-3 lg:sticky lg:top-24">
            <CtplPlanCard ctplProduct={selectedVehicle} />
            <Stepper
              steps={steps}
              currentStep={step}
              highestVisitedStep={highestVisitedStep}
              orientation="vertical"
              onStepChange={(newStep) => {
                setHighestVisitedStep(Math.max(highestVisitedStep, newStep))
                // You might want to add navigation logic here
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-3">{steps[step].component}</div>
      </div>
    </div>
  )
}
