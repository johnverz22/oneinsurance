'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useIdleService } from '@/utils/use-idle-service'
import {
  useFullQuoteResponseStore,
  useTravelInsuranceStore,
} from '@/store/travel-insurance-store'
import { ReviewCoverage } from '@/components/travel-insurance/review-coverage'
import { PersonalInfoForm } from '@/components/travel-insurance/personal-info-form'
import { TravelInsurancePayment } from '@/components/travel-insurance/payment'
import { PolicyDisplay } from '@/components/travel-insurance/policy-display'
import { PageLoader } from '@/components/page-loader'
import { Stepper } from '@/components/ui/stepper'
import TravelInsuranceReviewPage from '@/components/travel-insurance/review-page'
import { PlanPaymentReview } from '@/components/travel-insurance/plan-payment-review'
import { cn } from '@/lib/utils'
import { useAgentCodeStore } from '@/store/agent-code-store'

export default function AvailTravelInsurance() {
  const { step, highestVisitedStep, setStep, clientRequest, coverageOption } =
    useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()
  const [hydrated, setHydrated] = useState(false)
  const { apiResponse } = useFullQuoteResponseStore()
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)

  const router = useRouter()

  const handleIdle = useCallback(() => {
    alert('You have been inactive for a while.')
    router.push(`/${agentCode}/products/travel-insurance`)
  }, [router, agentCode])

  useIdleService('travel-insurance-form', 15, handleIdle)

  useEffect(() => {
    setHydrated(true)
    
    // Cleanup read-only mode flag when component unmounts
    return () => {
      // Only clear if user is not on step 3 (Review & Confirmation) or step 4 (Payment)
      // This prevents clearing the flag when navigating between these steps
      const currentStep = useTravelInsuranceStore.getState().step
      if (currentStep < 3) {
        sessionStorage.removeItem('proposal-readonly-mode')
      }
    }
  }, [])

  // Redirect if no valid travel insurance session exists
  useEffect(() => {
    if (hydrated) {
      // Check if we're loading from proposal search
      const loadingFromProposal = sessionStorage.getItem('loading-from-proposal')
      const targetStep = sessionStorage.getItem('proposal-target-step')
      const readOnlyMode = sessionStorage.getItem('proposal-readonly-mode')
      
      if (loadingFromProposal === 'true') {
        // Clear the loading flag
        sessionStorage.removeItem('loading-from-proposal')
        
        // Set read-only mode if specified
        if (readOnlyMode === 'true') {
          setIsReadOnlyMode(true)
        }
        
        // Set the target step if specified
        if (targetStep) {
          const stepNumber = parseInt(targetStep, 10)
          setStep(stepNumber)
          sessionStorage.removeItem('proposal-target-step')
          console.log(`✅ Loading from proposal search - set step to ${stepNumber} (step ${stepNumber + 1} in UI)`)
        }
        return
      }
      
      // Check if user has completed initial steps (has clientRequest.id and selectedPlan)
      const hasValidSession = clientRequest?.id && coverageOption?.selectedPlan

      if (!hasValidSession) {
        console.log('❌ No valid session - redirecting to main page')
        router.push(`/${agentCode}/products/travel-insurance`)
        return
      }
    }
  }, [hydrated, clientRequest?.id, coverageOption?.selectedPlan, router, agentCode, setStep])

  const steps = [
    {
      title: 'Search Plan',
      component: <div key={'search-plan'} />,
    },
    {
      title: 'Your Plan Details',
      component: <ReviewCoverage key={'review-coverage'} />,
    },
    {
      title: 'Personal Information',
      component: <PersonalInfoForm key={'personal-info-form'} />,
    },
    {
      title: 'Review & Confirmation',
      component: <TravelInsuranceReviewPage key={'review-page'} />,
    },
    {
      title: 'Payment',
      component: <TravelInsurancePayment key={'travel-insurance-payment'} />,
    },
  ]

  if (!hydrated) {
    return <PageLoader />
  }

  return (
    <div className="relative w-full bg-[#F3F5FC] pb-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-3 rounded-tl-full rounded-br-full bg-white px-13 py-1 shadow-lg">
          <Image
            src="/images/logo.png"
            alt="One Insurance"
            width={140}
            height={45}
            className="h-10 w-auto"
            priority
          />
        </div>
        <Image
          src="/images/IFRC.png"
          alt="IFRC"
          width={120}
          height={40}
          className="h-8 w-auto sm:h-10"
          priority
        />
      </div>
      <div className="flex items-start justify-start pt-6">
        <Stepper
          steps={steps}
          currentStep={step}
          highestVisitedStep={isReadOnlyMode ? step : highestVisitedStep}
          contentContainerClass="flex items-start md:justify-start"
          onStepChange={isReadOnlyMode ? undefined : (step) => setStep(step)}
        />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col-reverse gap-8 px-1.5 lg:flex-row">
        <div
          className={cn('lg:col-span-3 lg:w-3/5', { 'lg:w-full': step > 3 })}
        >
          {steps[step].component}
        </div>

        <div className={cn('relative lg:w-2/5', { hidden: step > 3 })}>
          <PlanPaymentReview
            stage={step <= 2 ? "initial" : "final"}
            grossPremium={
              // Use full quote response premium when available (step 3+), otherwise use selected plan premium
              step >= 3 && apiResponse?.data?.DuePremium 
                ? Number(apiResponse.data.DuePremium)
                : Number(coverageOption.selectedPlan?.DuePremium) || 0
            }
          />
        </div>
      </div>
    </div>
  )
}
