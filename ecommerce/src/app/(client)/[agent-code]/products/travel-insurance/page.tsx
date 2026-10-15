'use client'

import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { FAQsSection } from '@/components/faqs-section'
import { TestimonialSection } from '@/components/testimonial-section'
import { PlanHighlightsSection } from '@/components/plan-highlights-section'
import { TravelDetailsForm } from '@/components/travel-insurance/travel-details-form'
import { ProposalSearch } from '@/components/travel-insurance/proposal-search'
import { useTravelInsuranceStore, useFullQuoteResponseStore } from '@/store/travel-insurance-store'
import { TRAVEL_FAQS } from '@/constants/faqs/travel-insurance-faqs'
import { useTravelProviderFilter } from '@/store/travel-provider-filter-store'
import { useCreateQuoteRequest } from '@/app/data/mutations/create-quote-request'
import { useParams, useRouter } from 'next/navigation'
import { PageLoader } from '@/components/page-loader'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/star-rating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { clearProposalNumber } from '@/utils/payment-storage'
import { MobileProductNav } from '@/components/layout/mobile-product-nav'

export default function TravelInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TravelInsurancePageSSR />
    </Suspense>
  )
}

function TravelInsurancePageSSR() {
  const {
    resetForm,
    setInsurancePlans,
    resetAvailForm,
    setFormModified,
  } = useTravelInsuranceStore()
  const { setProviderFilter } = useTravelProviderFilter()
  const { resetApiResponse } = useFullQuoteResponseStore()
  const router = useRouter()
  const { mutateAsync } = useCreateQuoteRequest()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    
    // Always reset the full form when landing on this page.
    resetForm()
    setInsurancePlans(null)
    resetApiResponse()
    clearProposalNumber()
    setProviderFilter(null)
  }, [])

  return (
    <div className="relative pb-16 md:pb-0">
      {/* Shared mobile bottom nav + desktop chrome hiding + sidebar mount */}
      <MobileProductNav
        searchContent={<ProposalSearch />}
        searchTitle="Find Proposal"
      />

      {/* --- HERO SECTION --- overflow-x-hidden scoped here so the hero image
          doesn't bleed out, without affecting the compare table further down */}
      <div className="relative h-[25rem] w-full overflow-x-hidden md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image
            src="/images/travel-hero.png"
            alt="travel-hero"
            className="aspect-video object-cover opacity-65"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
          />

          <div className="absolute inset-0 bg-black/80 dark:bg-black/30" />

          {/* Mobile-only brand logo — header is hidden on mobile by MobileProductNav */}
          <div className="absolute top-4 left-3 z-10 md:hidden">
            <a href={`/${agentCode}`} className="flex cursor-pointer rounded-tl-full rounded-br-full bg-white px-6 py-1 shadow-lg">
              <Image src="/images/logo.png" alt="One Insurance" width={2172} height={724} className="h-7 w-auto" priority />
            </a>
          </div>
        </div>

        {/* Floating Logo Top Right */}
        <div className="absolute top-0 right-3 max-h-16 max-w-16 rounded-b-xl bg-white px-2 py-1.5 sm:right-8 sm:max-h-24 sm:max-w-24 sm:rounded-b-2xl sm:px-3 sm:py-2 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image
            src="/images/IFRC.png"
            alt="IFRC Logo"
            width={1290}
            height={800}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Hero Text */}
        <div className="absolute inset-0 mx-auto -mt-6 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-5 text-white lg:-mt-16">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">
            Travel Confidently
          </h1>
          <h2 className="hidden text-xl font-semibold text-slate-200 md:block md:text-2xl lg:text-3xl xl:text-4xl">
            We've Got You Covered!
          </h2>
          <p className="max-w-[280px] text-xs leading-relaxed text-slate-300 md:max-w-[90%] md:text-base lg:max-w-2/5">
            Get comprehensive travel insurance that protects you from trip
            cancellations, medical emergencies, and more—wherever your journey
            takes you.
          </p>
        </div>
      </div>

      {/* --- FORMS SECTION --- */}
      <div className="relative z-20 mx-auto -mt-24 flex w-full max-w-7xl flex-col rounded-t-3xl border-t border-border bg-white px-5 pb-5 pt-6 md:-mt-28 md:gap-8 md:rounded-none md:border-0 md:bg-transparent md:px-4 md:pt-0 lg:-mt-40 lg:gap-12">
        <style>{`
          @media (max-width: 767px) {
            [data-testid="travel-details-form"] {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
            [data-testid="travel-details-form"] > div {
              padding: 0 !important;
            }
          }
        `}</style>
        
        {/* Gate on `hydrated`: the form reads persisted Zustand state that the
            server can't see, so SSR vs first client render would mismatch.
            The mount effect resets the form anyway, so nothing is lost. */}
        {hydrated ? (
          <TravelDetailsForm />
        ) : (
          <div
            data-testid="travel-details-form"
            className="bg-card w-full space-y-6 rounded-md border shadow-lg lg:rounded-xl"
          >
            <div className="space-y-6 px-4 pt-3 pb-6 sm:px-8">
              <Skeleton className="h-11 w-56 rounded-full" />
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-4">
                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-4">
                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-12 w-40 rounded-full" />
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 md:mt-0">
          <ProposalSearch variant="collapsible" />
        </div>
      </div>

      {/* --- LOW PRIORITY CONTENT (lg+ only) --- */}
      <div className="relative mx-auto hidden w-full max-w-7xl flex-col items-center justify-center gap-2.5 px-4 lg:flex">
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
              <StarRating rating={5} starClassName="h-6 w-6" />
              <p>
                “Sobrang gaan ng loob ko nung nalaman kong covered pala kami ng travel insurance namin kahit na-delay ang flight namin sa Cebu. Ang bilis ng process at walang hassle. Highly recommended sa lahat ng magbabiyahe!”
              </p>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <p className="text-lg font-bold">Miguel Reyes</p>
              </div>
            </div>
            <div className="border-muted-foreground/20 h-full w-full space-y-3 rounded-xl border px-8 py-6 shadow-2xs">
              <StarRating rating={5} starClassName="h-6 w-6" />
              <p>
                “I travel frequently for work across Southeast Asia and One Insurance has been my go-to for travel coverage. The online process is seamless, and their support team was incredibly helpful when I had a medical emergency in Bangkok. Worth every peso!”
              </p>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <p className="text-lg font-bold">Andrea Cruz</p>
              </div>
            </div>
            <div className="border-muted-foreground/20 h-full w-full space-y-3 rounded-xl border px-8 py-6 shadow-2xs">
              <StarRating rating={5} starClassName="h-6 w-6" />
              <p>
                “Nagpunta kami ng pamilya sa Japan last December at talagang natuwa kami sa coverage ng One Insurance. Nag-file kami ng claim dahil may nawala kaming bagahe at napakabilis ng reimbursement. Definitely uulitin namin ito sa susunod na biyahe!”
              </p>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>JT</AvatarFallback>
                </Avatar>
                <p className="text-lg font-bold">Jose Tan</p>
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
