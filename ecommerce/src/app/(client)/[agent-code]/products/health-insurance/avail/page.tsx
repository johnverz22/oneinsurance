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
  fullName: '',
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
}

function HealthAvailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const agentCode = params['agent-code'] as string
  const proposalParam = searchParams.get('proposal')
  const { step, highestVisitedStep, setStep } = useHealthAvailStore()
  const { items, setProposalNo } = useHealthCartStore()
  const [hydrated, setHydrated] = useState(false)
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>(EMPTY_PERSONAL_INFO)
  const [personalInfoErrors, setPersonalInfoErrors] = useState<Record<string, string>>({})

  useEffect(() => { setHydrated(true) }, [])

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
          currentStep={step}
          highestVisitedStep={step}
          contentContainerClass="flex items-start md:justify-start"
          onStepChange={(s) => { if (s <= highestVisitedStep) setStep(s) }}
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex max-w-7xl flex-col-reverse gap-8 px-1.5 lg:flex-row">
        <div className={cn('lg:w-3/5', { 'lg:w-full': step === 4 })}>
          {stepContent()}
        </div>
        {showSidebar && (
          <div className="relative lg:w-2/5">
            <HealthPremiumSummary />
          </div>
        )}
      </div>
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
