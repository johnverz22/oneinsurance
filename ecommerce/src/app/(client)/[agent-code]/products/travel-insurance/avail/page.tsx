'use client'

import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
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
import {
  JourneyContainer,
  JourneyLayout,
  PageIntro,
} from '@/components/travel-insurance/journey-layout'
import { TRAVEL_JOURNEY_STEPS } from '@/constants/travel-journey'
import { JourneyActions } from '@/components/travel-insurance/journey-actions'
import TravelInsuranceReviewPage from '@/components/travel-insurance/review-page'
import { PlanPaymentReview } from '@/components/travel-insurance/plan-payment-review'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { usePaymentPhaseStore } from '@/store/payment-phase-store'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function AvailTravelInsurance() {
  const { step, highestVisitedStep, setStep, clientRequest, coverageOption } =
    useTravelInsuranceStore()
  const { agentCode } = useAgentCodeStore()
  const [hydrated, setHydrated] = useState(false)
  const { apiResponse } = useFullQuoteResponseStore()
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)

  const paymentPhase = usePaymentPhaseStore((s) => s.phase)
  const router = useRouter()
  const searchParams = useSearchParams()
  const proposalNumber = searchParams?.get('proposal')
  const [sessionNotice, setSessionNotice] = useState<{
    title: string
    message: string
  } | null>(null)

  const dismissSessionNotice = useCallback(() => {
    setSessionNotice(null)
    router.push(`/${agentCode}/products/travel-insurance`)
  }, [router, agentCode])

  const handleIdle = useCallback(() => {
    setSessionNotice({
      title: "You've been inactive for a while",
      message:
        'For your security, this session has ended. Start a new search to continue.',
    })
  }, [])

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
            setSessionNotice({
              title: 'Quote already issued',
              message:
                data.message ||
                'This travel insurance quote has already been issued and can no longer resume the process.',
            })
            useTravelInsuranceStore.setState({ isLoadingProposal: false })
            return
          }

          if (!response.ok || !data.success || !data.data) {
            console.error('Failed to load proposal from API')
            setSessionNotice({
              title: "We couldn't load your quote",
              message: 'Failed to load proposal. Please try again.',
            })
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

      // Skip validation if returning from DLT payment redirect
      // DLT appends ?status=success|failure&txn= or ?reference_id= to the return URL
      const isPaymentReturn =
        searchParams.get('status') ||
        searchParams.get('txn') ||
        searchParams.get('reference_id')
      if (isPaymentReturn) {
        console.log('✅ Skipping session validation - returning from payment redirect')
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
  }, [hydrated, clientRequest?.id, coverageOption?.selectedPlan, router, agentCode, proposalNumber, searchParams])

  const steps: Array<{
    title: string
    intro?: { title: string; helper: string }
    component: React.ReactNode
  }> = [
    {
      title: TRAVEL_JOURNEY_STEPS[0].title,
      component: <div key={'search-plan'} />,
    },
    {
      title: TRAVEL_JOURNEY_STEPS[1].title,
      intro: { title: 'Review your plan', helper: "Check coverage before continuing." },
      component: isReadOnlyMode ? <div key={'review-coverage-skip'} /> : <ReviewCoverage key={'review-coverage'} />,
    },
    {
      title: TRAVEL_JOURNEY_STEPS[2].title,
      intro: { title: 'Traveler information', helper: "Tell us who is traveling." },
      component: isReadOnlyMode ? <div key={'personal-info-skip'} /> : <PersonalInfoForm key={'personal-info-form'} />,
    },
    {
      title: TRAVEL_JOURNEY_STEPS[3].title,
      intro: { title: 'Review and confirm', helper: "Make sure everything is correct before you pay." },
      component: <TravelInsuranceReviewPage key={'review-page'} />,
    },
    {
      title: TRAVEL_JOURNEY_STEPS[4].title,
      intro: { title: 'Payment', helper: "Choose how you'd like to pay." },
      component: <TravelInsurancePayment key={'travel-insurance-payment'} />,
    },
  ]

  if (!hydrated) {
    return <PageLoader />
  }

  const paymentBusy = step === 4 && paymentPhase !== 'idle'

  return (
    <JourneyLayout
      fill={paymentBusy}
      className={paymentBusy ? 'pb-8 lg:pb-12' : undefined}
      agentCode={agentCode}
      steps={steps}
      currentStep={step}
      highestVisitedStep={isReadOnlyMode ? step : highestVisitedStep}
      onStepChange={isReadOnlyMode ? undefined : (step) => setStep(step)}
    >
      <JourneyContainer className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6 lg:flex-1">
          {!paymentBusy && steps[step].intro && (
            <PageIntro
              title={steps[step].intro.title}
              helper={steps[step].intro.helper}
            />
          )}
          {steps[step].component}
        </div>

        <div className="hidden lg:block lg:w-80 lg:shrink-0 lg:self-stretch">
          <PlanPaymentReview
            stage={step <= 2 ? 'initial' : 'final'}
            grossPremium={
              step >= 3 && apiResponse?.data?.DuePremium
                ? Number(apiResponse.data.DuePremium)
                : Number(coverageOption.selectedPlan?.DuePremium) || 0
            }
          >
            {paymentBusy ? (
              (paymentPhase === 'error' || paymentPhase === 'success') && (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full bg-transparent font-semibold"
                  onClick={() => {
                    if (paymentPhase === 'success') {
                      useTravelInsuranceStore.getState().resetForm()
                      window.location.href = `/${agentCode}/products/travel-insurance`
                    } else router.push(`/${agentCode}/products/travel-insurance`)
                  }}
                >
                  {paymentPhase === 'success' ? 'Buy new Travel Insurance' : 'Back to Travel Insurance'}
                </Button>
              )
            ) : step >= 1 && (
              <JourneyActions
                key={step}
                backFallback={step === 1 ? 'Cancel' : 'Back'}
                nextFallback="Next"
              />
            )}
          </PlanPaymentReview>
        </div>
      </JourneyContainer>

      {/* ── Mobile bottom action bar ── */}
      {!paymentBusy && step >= 1 && step <= 4 && coverageOption.selectedPlan && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
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
              className="shrink-0 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {/* Center: premium */}
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground leading-none">Total Premium</p>
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
                else if (step === 4) toast.info('Select a payment method first')
              }}
              className="shrink-0 rounded-full bg-gradient-to-r from-primary to-lilac px-5 py-2.5 text-xs font-semibold text-primary-foreground"
            >
              {step === 1 ? 'Next' : step === 2 ? 'Continue' : step === 3 ? 'Proceed' : 'Pay'}
            </button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!sessionNotice}
        onOpenChange={(open) => {
          if (!open) dismissSessionNotice()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sessionNotice?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {sessionNotice?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Back to Travel Insurance</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </JourneyLayout>
  )
}
