'use client'

import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { FAQsSection } from '@/components/faqs-section'
import { TestimonialSection } from '@/components/testimonial-section'
import { PlanHighlightsSection } from '@/components/plan-highlights-section'
import { TravelDetailsForm } from '@/components/travel-insurance/travel-details-form'
import { ProposalSearch } from '@/components/travel-insurance/proposal-search'
import { useTravelInsuranceStore } from '@/store/travel-insurance-store'
import { TRAVEL_FAQS } from '@/constants/faqs/travel-insurance-faqs'
import { removeStorage } from '@/utils/remove-session-storage'
import { CoverageOptionsForm } from '@/components/travel-insurance/coverage-options-form'
import { useCreateQuoteRequest } from '@/app/data/mutations/create-quote-request'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLoader } from '@/components/page-loader'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function TravelInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TravelInsurancePageSSR />
    </Suspense>
  )
}

function TravelInsurancePageSSR() {
  const {
    travelDetails,
    clientRequest,
    insurancePlans,
    setClientRequest,
    setFormModified,
    resetAvailForm,
    setInsurancePlans,
  } = useTravelInsuranceStore()
  const router = useRouter()
  const { mutateAsync } = useCreateQuoteRequest()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && insurancePlans) {
      resetAvailForm()
      setFormModified(false)
      return
    }

    async function fetchCoverageOption() {
      try {
        // Check if we have valid travel details before making API call
        if (!travelDetails.departureDate || !travelDetails.returnDate || !travelDetails.dateOfBirth) {
          console.log('⚠️ Incomplete travel details - skipping API call')
          return
        }

        // Ensure dates are properly converted to Date objects
        const sanitizedTravelDetails = {
          ...travelDetails,
          dateOfBirth: travelDetails.dateOfBirth
            ? new Date(travelDetails.dateOfBirth)
            : travelDetails.dateOfBirth,
          departureDate: travelDetails.departureDate
            ? new Date(travelDetails.departureDate)
            : travelDetails.departureDate,
          returnDate: travelDetails.returnDate
            ? new Date(travelDetails.returnDate)
            : travelDetails.returnDate,
        }

        const clientRequestId = await mutateAsync(sanitizedTravelDetails)

        setClientRequest({
          id: clientRequestId,
          status: 'fetching',
        })

        setFormModified(false) // Clear form modified state on initial load

        const coverageOptions = document.getElementById('coverage-options')
        coverageOptions?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      } catch (error) {
        console.error('Failed to fetch coverage options:', error)
        setClientRequest({ status: 'error' })
      }
    }

    if (!clientRequest.id && hydrated) {
      fetchCoverageOption()
    }
  }, [hydrated, clientRequest.id])

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
            onClick={() => router.push('/')}
            className="absolute top-8 left-4 z-10 cursor-pointer gap-3 rounded-tl-full rounded-br-full bg-white px-12 py-1 shadow-lg lg:left-28 xl:left-32"
          >
            <Image
              src="/images/logo.png"
              alt="One Insurance"
              width={140}
              height={45}
              className="h-10 w-auto"
              priority
            />
          </div>

          <div className="absolute inset-0 bg-black/80 dark:bg-black/30" />
        </div>

        <div className="absolute top-0 right-4 max-h-24 max-w-24 rounded-b-2xl bg-white px-3 py-2 sm:right-8 sm:max-h-32 sm:max-w-32 sm:px-4 sm:py-3 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image
            src="/images/IFRC.png"
            alt="IFRC Logo"
            width={1920}
            height={1240}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">
            Travel Confidently
          </h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl xl:text-4xl">
            We've Got You Covered!
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

      <div id="coverage-options" className="relative w-full pt-16 pb-12">
        <CoverageOptionsForm />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-2.5 px-4">
        <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-center text-2xl font-black text-transparent sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
          Why Choose Us?
        </h1>
        <p className="max-w-4/5 text-center text-sm md:text-base">
          We put people first. We're committed to doing the right thing, the
          right way. Choose Insurance for its simplicity and online ease, backed
          by more than 80 years of expertise. We lead with innovation and a
          commitment to you.
        </p>

        <div className="grid w-full gap-6 py-6 md:grid-cols-3">
          {/* Card 1 - People Who Trust Us */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src="/images/choose/trust.png"
                alt="People Who Trust Us"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Card 2 - Claims Settlement */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src="/images/choose/claim-settlement.png"
                alt="Claims Settlement"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Card 3 - Partner Network */}
          <div className="group relative overflow-hidden rounded-2xl">
            <div className="relative h-80 w-full">
              <Image
                src="/images/choose/partner.png"
                alt="Partner Network"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        <div className="grid w-full gap-6 py-6 lg:grid-cols-2">
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src="/images/testimonials/hero.jpg"
              alt="Customers"
              className="h-full w-full rounded-2xl object-cover"
              fill
            />

            <div className="absolute -top-1 left-0 w-full">
              <div className="absolute inset-0 z-10 hidden lg:block">
                <div className="absolute top-0 left-0 h-8 w-[57.25%] rounded-br-full bg-white" />
                <div className="absolute top-0 h-12 w-4/7 rounded-r-full bg-white lg:h-20" />
                <div className="absolute top-10 h-12 w-5/7 rounded-r-2xl bg-white lg:h-20" />
                <div className="absolute top-12 -left-1 h-20 w-4 rounded-br-xl bg-white" />
              </div>
              <h4 className="from-primary to-accent relative z-20 bg-gradient-to-r bg-clip-text px-4 py-5 text-2xl font-black text-transparent lg:text-4xl">
                Safe Journeys,
                <br />
                Happy Customers
              </h4>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="from-primary to-accent h-full w-full space-y-3 rounded-xl bg-gradient-to-r px-8 py-6 text-white shadow-2xs">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} stroke="0.5" fill="#FFA500" />
                ))}
              </div>
              <p>
                “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.”
              </p>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src="https://avatar.iran.liara.run/public"
                    alt="avatar"
                    className="size-8"
                  />
                  <AvatarFallback>Avatar</AvatarFallback>
                </Avatar>
                <p className="text-lg font-bold">John Doe</p>
              </div>
            </div>
            <div className="border-muted-foreground/20 h-full w-full space-y-3 rounded-xl border px-8 py-6 shadow-2xs">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} stroke="0.5" fill="#FFA500" />
                ))}
              </div>
              <p>
                “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.”
              </p>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src="https://avatar.iran.liara.run/public"
                    alt="avatar"
                    className="size-8"
                  />
                  <AvatarFallback>Avatar</AvatarFallback>
                </Avatar>
                <p className="text-lg font-bold">John Doe</p>
              </div>
            </div>
            <div className="border-muted-foreground/20 h-full w-full space-y-3 rounded-xl border px-8 py-6 shadow-2xs">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} stroke="0.5" fill="#FFA500" />
                ))}
              </div>
              <p>
                “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.”
              </p>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src="https://avatar.iran.liara.run/public"
                    alt="avatar"
                    className="size-8"
                  />
                  <AvatarFallback>Avatar</AvatarFallback>
                </Avatar>
                <p className="text-lg font-bold">John Doe</p>
              </div>
            </div>
          </div>
        </div>

        <FAQsSection
          faqs={TRAVEL_FAQS}
          title="Frequently Asked Questions"
          description="Find quick answers to common questions about our Travel Insurance."
        />
      </div>
    </div>
  )
}
