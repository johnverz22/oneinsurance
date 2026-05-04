'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Stepper } from '@/components/ui/stepper'
import { PageLoader } from '@/components/page-loader'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { cn } from '@/lib/utils'
import VehicleRegistration from '@/components/ctpl-insurance/vehicle-registration-page'
import CtplPersonalInfoForm from '@/components/ctpl-insurance/ctpl-personal-info-form'
import CtplReviewPage from '@/components/ctpl-insurance/ctpl-review-page'
import CtplPremiumSummary from '@/components/ctpl-insurance/ctpl-premium-summary'
import CtplPlanDetailsStep from '@/components/ctpl-insurance/ctpl-plan-details-step'
import CtplPaymentStep from '@/components/ctpl-insurance/ctpl-payment-step'

function CtplAvailContent() {
  const params = useParams()
  const router = useRouter()
  const agentCode = params['agent-code'] as string
  const { step, highestVisitedStep, selectedVehicle, setHighestVisitedStep, setStep } = useCtplInsuranceStateStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  // Handle step parameter from URL (for proposal search)
  useEffect(() => {
    if (hydrated) {
      const urlParams = new URLSearchParams(window.location.search)
      const stepParam = urlParams.get('step')
      
      if (stepParam) {
        const targetStep = parseInt(stepParam)
        if (!isNaN(targetStep) && targetStep >= 0 && targetStep <= 4) {
          console.log(`📍 Navigating to step ${targetStep} from URL parameter`)
          setStep(targetStep)
          setHighestVisitedStep(targetStep)
        }
      }
    }
  }, [hydrated, setStep, setHighestVisitedStep])

  useEffect(() => {
    if (hydrated && !selectedVehicle?.title) {
      router.push(`/${agentCode}/products/motor-insurance`)
    }
  }, [hydrated, selectedVehicle, agentCode, router])

  if (!hydrated) return <PageLoader />
  if (!selectedVehicle?.title) return <PageLoader />

  // 6 steps in UI:
  // 1=Search Plan (landing), 2=Your Plan Details, 3=Vehicle Details, 4=Personal Info, 5=Review, 6=Payment
  // Internal step index: 0=Plan Details, 1=Vehicle, 2=Personal, 3=Review, 4=Payment
  const steps = [
    { title: 'Search Plan' },
    { title: 'Your Plan Details' },
    { title: 'Vehicle Details' },
    { title: 'Personal Information' },
    { title: 'Review & Confirmation' },
    { title: 'Payment' },
  ]

  const stepperCurrentStep = step + 1 // step 0 maps to stepper step 1

  // Show sidebar only for steps 1-3 (Vehicle Details and Personal Info)
  const showSidebar = step >= 1 && step <= 2

  const stepContent = () => {
    switch (step) {
      case 0: return <CtplPlanDetailsStep />
      case 1: return <VehicleRegistration />
      case 2: return <CtplPersonalInfoForm />
      case 3: return <CtplReviewPage />
      case 4: return <CtplPaymentStep />
      default: return null
    }
  }

  return (
    <div className="relative w-full bg-[#F3F5FC] pb-10">
      {/* Header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push(`/${agentCode}`)}
          className="inline-flex cursor-pointer items-center gap-3 rounded-tl-full rounded-br-full bg-white px-13 py-1 shadow-lg"
        >
          <Image src="/images/logo.png" alt="One Insurance" width={140} height={45} className="h-10 w-auto" priority />
        </div>
        <Image src="/images/IFRC.png" alt="IFRC" width={120} height={40} className="h-8 w-auto sm:h-10" priority />
      </div>

      {/* Stepper */}
      <div className="flex items-start justify-start pt-6">
        <Stepper
          steps={steps}
          currentStep={stepperCurrentStep}
          highestVisitedStep={stepperCurrentStep}
          contentContainerClass="flex items-start md:justify-start"
          onStepChange={(s) => {
            if (s > 0 && s - 1 <= highestVisitedStep) {
              setHighestVisitedStep(s - 1)
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-1.5">
        {step === 0 ? (
          // Plan Details step manages its own two-column layout internally
          <div className="py-6">{stepContent()}</div>
        ) : (
          <div className="relative flex flex-col-reverse gap-8 lg:flex-row">
            <div className={cn('lg:w-3/5', { 'lg:w-full': step === 3 || step === 4 })}>
              {stepContent()}
            </div>
            {showSidebar && (
              <div className="relative lg:w-2/5">
                <CtplPremiumSummary />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CtplAvailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CtplAvailContent />
    </Suspense>
  )
}
