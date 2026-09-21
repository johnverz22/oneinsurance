'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const proposalNumber = searchParams?.get('proposal')

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

  // Load proposal from API if proposal number is in URL
  useEffect(() => {
    if (hydrated && proposalNumber) {
      console.log('📋 Proposal number detected in URL:', proposalNumber)
      console.log('🔄 Fetching fresh data from backend API...')
      
      const loadProposal = async () => {
        // Set loading flag
        useTravelInsuranceStore.setState({ isLoadingProposal: true })
        
        try {
          const response = await fetch('/api/travel-insurance/load-quote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ProposalNo: proposalNumber,
            }),
          })

          const data = await response.json()
          
          // Handle 422 error - proposal already issued
          if (response.status === 422) {
            console.error('❌ Proposal already issued:', data.message)
            alert(data.message || 'This travel insurance quote has already been issued and can no longer resume the process.')
            router.push(`/${agentCode}/products/travel-insurance`)
            useTravelInsuranceStore.setState({ isLoadingProposal: false })
            return
          }
          
          if (!response.ok || !data.success || !data.data) {
            console.error('Failed to load proposal from API')
            alert('Failed to load proposal. Please try again.')
            router.push(`/${agentCode}/products/travel-insurance`)
            useTravelInsuranceStore.setState({ isLoadingProposal: false })
            return
          }

          const proposalData = data.data
          console.log('✅ Loaded proposal from API')
          
          // Extract plan name
          const planName = proposalData.CustomField?.PlanName || proposalData.PlanName || proposalData.ProductName || 'Travel Insurance'
          
          // Extract benefits
          const mainBenefits: any[] = []
          const firstRisk = proposalData.PolicyLobList?.[0]?.PolicyRiskList?.[0]
          if (firstRisk?.PolicyCoverageList) {
            firstRisk.PolicyCoverageList.forEach((coverage: any) => {
              mainBenefits.push({
                BenefitCode: coverage.ProductElementCode || '',
                BenefitDesc: coverage.CoverageName || '',
                BenefitType: 'MAIN',
                CoverageName: coverage.CoverageName || '',
                DefaultLimitDesc: '',
                DisplaySeqNo: coverage.SequenceNumber?.toString() || '0',
                LimitModeDesc: '',
                ParentBenefit: null,
                Silimit: '0',
                SubCoverageName: '',
              })
            })
          }
          
          // Create plan object
          const realPlan = {
            CarrierCode: proposalData.CarrierCode,
            CarrierPlanCode: proposalData.CarrierPlanCode || proposalData.PlanCode,
            CarrierPlanDesc: planName,
            CarrierProductCode: proposalData.CarrierProductCode || '',
            CarrierProductName: proposalData.ProductName || 'Travel Insurance',
            DuePremium: Number(proposalData.DuePremium) || 0,
            GrossPremium: Number(proposalData.GrossPremium) || 0,
            BeforeVatPremium: Number(proposalData.BeforeVatPremium) || 0,
            AnnualPremium: Number(proposalData.AnnualPremium) || 0,
            ProductCode: proposalData.ProductCode,
            ProductVersion: proposalData.ProductVersion,
            MainBenefits: mainBenefits,
            AddonBenefits: [],
            LGTAmount: Number(proposalData.LGT) || 0,
            DiscountAmount: null,
            PremiumTaxAmt: 0,
            StampDuty: 0,
            SumInsured: proposalData.SumInsured?.toString() || null,
            TaxAmount: 0,
            VatAmount: null,
          }
          
          // Set all state from API data
          useTravelInsuranceStore.setState({
            clientRequest: {
              id: proposalData.ProposalNo,
              status: 'success'
            },
            coverageOption: {
              carrierCode: proposalData.CarrierCode || '',
              selectedPlan: realPlan as any,
              selectedAddonBenefits: [],
            },
            travelDetails: {
              ...useTravelInsuranceStore.getState().travelDetails,
              travelDetailList: proposalData.TravelDetailList || [],
              departureDate: proposalData.EffectiveDate ? new Date(proposalData.EffectiveDate) : new Date(),
              returnDate: proposalData.ExpiryDate ? new Date(proposalData.ExpiryDate) : new Date(),
              dateOfBirth: proposalData.PolicyCustomerList?.[0]?.DateOfBirth 
                ? new Date(proposalData.PolicyCustomerList[0].DateOfBirth) 
                : new Date(),
              noOfAdults: proposalData.NoOfAdults || 1,
              noOfChildren: proposalData.NoOfChildren || 0,
              isAnnualMultiTrip: proposalData.TripType === 'ANNUAL',
              agreedToTerms: true,
            },
            travelersInfo: proposalData.PolicyLobList?.[0]?.PolicyRiskList?.map((risk: any) => ({
              firstName: risk.FirstName || '',
              middleName: risk.MiddleName || '',
              lastName: risk.LastName || '',
              suffix: risk.Suffix || 'No Suffix',
              gender: risk.Gender || 'M',
              email: risk.Email || '',
              mobileNumber: risk.Mobile?.replace('+63', '') || '',
              idType: risk.IdTypeCode || 'PAS',
              idNumber: risk.IdNo || '',
              address: {
                province: risk.AddrProvince || '',
                city: risk.City || '',
                zipCode: risk.PostCode || '',
                line1: risk.AddressLine1 || '',
                line2: risk.AddressLine2 || '',
              },
              dateOfBirth: risk.DateOfBirth ? new Date(risk.DateOfBirth) : new Date(),
              isCovidVaccinated: false,
              is_data_sharing_consent: false,
              hasBeneficiary: false,
              beneficiary: {
                firstName: '',
                middleName: '',
                lastName: '',
                dateOfBirth: null,
                relationship: '',
              },
            })) || [],
            isLoadingProposal: false, // Clear loading flag
          })
          
          // Set API response
          useFullQuoteResponseStore.setState({
            apiResponse: {
              success: true,
              message: 'Proposal loaded',
              data: proposalData
            }
          })
          
          // Set read-only mode and step
          setIsReadOnlyMode(true)
          sessionStorage.setItem('proposal-readonly-mode', 'true') // Set flag for review page
          setStep(3) // Review & Confirmation
          
          console.log('✅ All state set from API data')
          
        } catch (error) {
          console.error('Error loading proposal:', error)
          useTravelInsuranceStore.setState({ isLoadingProposal: false })
          router.push(`/${agentCode}/products/travel-insurance`)
        }
      }
      
      loadProposal()
    }
  }, [hydrated, proposalNumber, router, agentCode, setStep])

  // Redirect if no valid travel insurance session exists
  useEffect(() => {
    if (hydrated) {
      // Skip validation if loading from proposal via URL parameter
      if (proposalNumber) {
        console.log('✅ Skipping session validation - loading from proposal via URL')
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
  }, [hydrated, clientRequest?.id, coverageOption?.selectedPlan, router, agentCode, proposalNumber])

  const steps = [
    {
      title: 'Search Plan',
      component: <div key={'search-plan'} />,
    },
    {
      title: 'Your Plan Details',
      component: isReadOnlyMode ? <div key={'review-coverage-skip'} /> : <ReviewCoverage key={'review-coverage'} />,
    },
    {
      title: 'Personal Information',
      component: isReadOnlyMode ? <div key={'personal-info-skip'} /> : <PersonalInfoForm key={'personal-info-form'} />,
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
    <div className="relative min-h-screen w-full bg-[#F3F5FC]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b border-gray-200/60 bg-white shadow-sm lg:relative lg:z-auto lg:border-0 lg:bg-[#F3F5FC] lg:shadow-none">
        {/* Logo bar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8 lg:pt-5 lg:pb-2">
          <a href={`/${agentCode}`} className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="One Insurance"
              width={140}
              height={45}
              className="h-7 w-auto lg:h-9"
              priority
            />
          </a>
          <Image
            src="/images/IFRC.png"
            alt="IFRC"
            width={80}
            height={40}
            className="h-8 w-auto opacity-80 lg:h-10"
            priority
          />
        </div>

        {/* Step progress */}
        <div className="lg:pt-2 lg:pb-0">
          <Stepper
            steps={steps}
            currentStep={step}
            highestVisitedStep={isReadOnlyMode ? step : highestVisitedStep}
            contentContainerClass="flex items-start md:justify-start"
            onStepChange={isReadOnlyMode ? undefined : (step) => setStep(step)}
          />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col-reverse gap-8 px-1.5 pb-20 lg:flex-row lg:items-start lg:pb-0">
        <div className={cn('lg:col-span-3 lg:w-3/5', { 'lg:w-full': step > 3 })}>
          {steps[step].component}
        </div>

        <div className={cn('relative hidden lg:block lg:w-2/5', { 'lg:hidden': step > 3 })}>
          <PlanPaymentReview
            stage={step <= 2 ? 'initial' : 'final'}
            grossPremium={
              step >= 3 && apiResponse?.data?.DuePremium
                ? Number(apiResponse.data.DuePremium)
                : Number(coverageOption.selectedPlan?.DuePremium) || 0
            }
          />
        </div>
      </div>

      {/* ── Mobile bottom action bar (steps 1–3) ── */}
      {step >= 1 && step <= 3 && coverageOption.selectedPlan && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            {/* Left: Cancel (step 1) or Back (steps 2–3) */}
            <button
              type="button"
              onClick={() => {
                if (step === 1) {
                  // Cancel — back to travel insurance search
                  router.push(`/${agentCode}/products/travel-insurance`)
                } else {
                  const backBtn = document.querySelector('[data-mobile-action="back"]') as HTMLButtonElement
                  if (backBtn) backBtn.click()
                  else setStep(step - 1)
                }
              }}
              className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {/* Center: premium */}
            <div className="flex-1 text-center">
              <p className="text-[10px] text-gray-500 leading-none">Total Premium</p>
              <p className="text-sm font-black text-primary leading-tight">
                ₱{(
                  step >= 3 && apiResponse?.data?.DuePremium
                    ? Number(apiResponse.data.DuePremium)
                    : Number(coverageOption.selectedPlan.DuePremium) || 0
                ).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Right: primary action */}
            <button
              type="button"
              onClick={() => {
                const nextBtn = document.querySelector('[data-mobile-action="next"]') as HTMLButtonElement
                if (nextBtn) nextBtn.click()
              }}
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-white"
            >
              {step === 1 ? 'Next' : step === 2 ? 'Continue' : 'Proceed'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
