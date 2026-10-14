'use client'

import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Stepper } from '@/components/ui/stepper'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { HealthPlanDetailsStep } from '@/components/health-insurance/health-plan-details-step'
import { HealthPersonalInfoForm } from '@/components/health-insurance/health-personal-info-form'
import { HealthReviewPage } from '@/components/health-insurance/health-review-page'
import { HealthPaymentStep } from '@/components/health-insurance/health-payment-step'
import { HealthPremiumSummary } from '@/components/health-insurance/health-premium-summary'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { useHealthCartStore } from '@/store/health-cart-store'
import { cn } from '@/lib/utils'
import type { PersonalInfoData } from '@/components/health-insurance/health-personal-info-form'

const EMPTY_PERSONAL_INFO: PersonalInfoData = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: 'No Suffix',
  gender: 'M',
  dateOfBirth: '',
  email: '',
  phone: '',
  placeOfBirth: '',
  idTypeCode: 'PAS',
  idNo: '',
  addressLine1: '',
  addressLine2: '',
  province: '',
  city: '',
  postCode: '',
  isCovidVaccinated: false,
  isDataSharingConsent: false,
}

function HealthAvailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentCode = params['agent-code'] as string
  const proposalParam = searchParams.get('proposal')
  const { step, highestVisitedStep, setStep } = useHealthAvailStore()
  const { items, setProposalNo, insuredInfo } = useHealthCartStore()
  const [hydrated, setHydrated] = useState(false)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>(EMPTY_PERSONAL_INFO)
  const [personalInfoErrors, setPersonalInfoErrors] = useState<Record<string, string>>({})

  useEffect(() => { setHydrated(true) }, [])

  // Pre-fill personal info from the search form data (insuredInfo)
  useEffect(() => {
    if (hydrated && insuredInfo) {
      setPersonalInfo((prev) => ({
        ...prev,
        firstName: prev.firstName || insuredInfo.firstName || '',
        lastName: prev.lastName || insuredInfo.lastName || '',
        email: prev.email || insuredInfo.email || '',
        phone: prev.phone || insuredInfo.mobile || '',
        dateOfBirth: prev.dateOfBirth || insuredInfo.dateOfBirth || '',
        gender: insuredInfo.genderCode || prev.gender,
      }))
    }
  }, [hydrated, insuredInfo])

  // Handle ?proposal= URL param — load and go to step 3
  useEffect(() => {
    if (hydrated && proposalParam) {
      setProposalNo(proposalParam)
      setStep(3)
    }
  }, [hydrated, proposalParam, setProposalNo, setStep])

  // If no items and no proposal param, redirect back
  useEffect(() => {
    if (hydrated && items.length === 0 && !proposalParam) {
      router.push(`/${agentCode}/products/health-insurance`)
    }
  }, [hydrated, items.length, proposalParam, agentCode, router])

  if (!hydrated) return <PageLoader />

  const steps = [
    { title: 'Search Plan' },
    { title: 'Your Plan Details' },
    { title: 'Personal Information' },
    { title: 'Review & Confirmation' },
    { title: 'Payment' },
  ]

  const showSidebar = step >= 1 && step <= 3

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-muted-foreground mb-4">No plan selected. Please go back and search for a plan.</p>
            <Button
              className="from-primary to-accent rounded-full bg-gradient-to-r px-8 text-white"
              onClick={() => router.push(`/${agentCode}/products/health-insurance`)}
            >
              Back to Search
            </Button>
          </div>
        )
      case 1:
        return <HealthPlanDetailsStep />
      case 2:
        return (
          <HealthPersonalInfoForm
            data={personalInfo}
            onChange={setPersonalInfo}
            errors={personalInfoErrors}
            onErrorsChange={setPersonalInfoErrors}
            onContinue={() => setStep(3)}
          />
        )
      case 3:
        return <HealthReviewPage personalInfo={personalInfo} />
      case 4:
        return <HealthPaymentStep personalInfo={personalInfo} agentCode={agentCode} />
      default:
        return null
    }
  }

  return (
    <div className="relative w-full bg-section pb-10">
      {/* Sticky header on mobile: logos + step indicator */}
      <div className="sticky top-0 z-20 bg-section lg:relative lg:z-auto">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/${agentCode}`)}
            className="inline-flex cursor-pointer items-center gap-3 rounded-tl-full rounded-br-full bg-white px-4 py-1 shadow-lg sm:px-13"
          >
            <Image src="/images/logo.png" alt="One Insurance" width={256} height={63} className="h-5 w-auto sm:h-10" priority />
          </div>
          <Image src="/images/IFRC.png" alt="IFRC" width={1290} height={800} className="h-4 w-auto sm:h-10" priority />
        </div>

        {/* Stepper */}
        <div className="flex items-start justify-start pt-2 pb-1 lg:pt-6 lg:pb-0">
          <Stepper
            steps={steps}
            currentStep={step}
            highestVisitedStep={step}
            contentContainerClass="flex items-start md:justify-start"
            onStepChange={(s) => { if (s <= highestVisitedStep) setStep(s) }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto flex max-w-7xl flex-col-reverse gap-8 px-1.5 pb-16 lg:flex-row lg:pb-0">
        <div className={cn('lg:w-3/5', { 'lg:w-full': step === 4 })}>
          {stepContent()}
        </div>
        {showSidebar && (
          <div className="relative hidden lg:block lg:w-2/5">
            <HealthPremiumSummary />
          </div>
        )}
      </div>

      {/* Fixed bottom premium bar — mobile only */}
      {items.length > 0 && step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="shrink-0">
              <p className="text-[11px] text-muted-foreground">Total Premium</p>
              <p className="text-base font-black text-primary">
                ₱{(items.reduce((sum, i) => sum + i.premium * i.quantity, 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const backBtn = document.querySelector('[data-mobile-action="back"]') as HTMLButtonElement
                    if (backBtn) backBtn.click()
                    else setStep(step - 1)
                  }}
                  className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const nextBtn = document.querySelector('[data-mobile-action="next"]') as HTMLButtonElement
                  if (nextBtn) nextBtn.click()
                }}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
              >
                {step === 0 ? 'Next' : step === 1 ? 'Next' : step === 2 ? 'Submit' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HealthInsuranceAvailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HealthAvailContent />
    </Suspense>
  )
}
