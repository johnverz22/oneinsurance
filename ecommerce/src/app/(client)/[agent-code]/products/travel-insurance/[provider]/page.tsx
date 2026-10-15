'use client'

import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { FAQsSection } from '@/components/faqs-section'
import { TravelDetailsForm } from '@/components/travel-insurance/travel-details-form'
import { ProposalSearch } from '@/components/travel-insurance/proposal-search'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { TRAVEL_FAQS } from '@/constants/faqs/travel-insurance-faqs'
import { useAgentCodeStore } from '@/store/agent-code-store'
import { useRouter, useParams } from 'next/navigation'
import { PageLoader } from '@/components/page-loader'
import { useTravelProviderFilter } from '@/store/travel-provider-filter-store'

// Map URL slugs to carrier codes
const PROVIDER_SLUG_MAP: Record<string, string> = {
  'oona': 'OONAPH',
  'pacific-cross': 'PACIFIC',
  'malayan': 'MALAYAN',
}

export default function ProviderTravelInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProviderTravelInsurancePageContent />
    </Suspense>
  )
}

function ProviderTravelInsurancePageContent() {
  const {
    resetForm,
    setInsurancePlans,
  } = useTravelInsuranceStore()
  const { resetApiResponse } = useFullQuoteResponseStore()
  const router = useRouter()
  const params = useParams()
  const providerSlug = params.provider as string
  const { setProviderFilter } = useTravelProviderFilter()
  const { agentCode } = useAgentCodeStore()

  useEffect(() => {
    // Set the provider filter based on URL slug
    const carrierCode = PROVIDER_SLUG_MAP[providerSlug]
    if (carrierCode) {
      setProviderFilter(carrierCode)
    } else {
      // Invalid provider slug — redirect to main travel page
      router.replace(`/${params['agent-code']}/products/travel-insurance`)
    }

    // Reset form on mount
    resetForm()
    setInsurancePlans(null)
    resetApiResponse()
  }, [providerSlug])

  const providerName = providerSlug === 'oona' ? 'Oona Insurance' 
    : providerSlug === 'pacific-cross' ? 'Pacific Cross' 
    : providerSlug === 'malayan' ? 'Malayan Insurance' 
    : 'Travel Insurance'

  return (
    <div className="relative overflow-hidden">
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image
            src="/images/travel-hero.png"
            alt="travel-hero"
            className="aspect-video object-cover opacity-65"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
          />
          <div
            tabIndex={0}
            role="button"
            onClick={() => router.push(`/${agentCode}/products/travel-insurance`)}
            className="absolute top-8 left-4 z-10 cursor-pointer gap-3 rounded-tl-full rounded-br-full bg-white px-12 py-1 shadow-lg lg:left-28 xl:left-32"
          >
            <Image src="/images/logo.png" alt="One Insurance" width={2172} height={724} className="h-10 w-auto" priority />
          </div>
          <div className="absolute inset-0 bg-black/80 dark:bg-black/30" />
        </div>

        <div className="absolute top-0 right-4 max-h-24 max-w-24 rounded-b-2xl bg-white px-3 py-2 sm:right-8 sm:max-h-32 sm:max-w-32 sm:px-4 sm:py-3 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1290} height={800} className="h-full w-full object-contain" />
        </div>

        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">
            Travel Confidently
          </h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl xl:text-4xl">
            with {providerName}
          </h2>
          <p className="max-w-4/5 text-sm md:text-base lg:max-w-2/5">
            Get comprehensive travel insurance that protects you from trip
            cancellations, medical emergencies, and more—wherever your journey
            takes you.
          </p>
        </div>
      </div>

      <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col gap-8 px-1.5 lg:-mt-40 lg:gap-12">
        <TravelDetailsForm />
        <ProposalSearch />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-2.5 px-4">
        <FAQsSection
          faqs={TRAVEL_FAQS}
          title="Frequently Asked Questions"
          description="Find quick answers to common questions about our Travel Insurance."
        />
      </div>
    </div>
  )
}
