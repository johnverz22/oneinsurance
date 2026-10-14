'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { PageLoader } from '@/components/page-loader'
import { FAQsSection } from '@/components/faqs-section'
import { HealthDetailsForm } from '@/components/health-insurance/health-details-form'
import { HealthPlansGrid } from '@/components/health-insurance/health-plans-grid'
import { HealthTestimonials } from '@/components/health-insurance/health-testimonials'
import { HealthProposalSearch } from '@/components/health-insurance/health-proposal-search'
import { HEALTH_FAQS } from '@/constants/faqs/health-insurance'
import { useHealthCartStore } from '@/store/health-cart-store'
import { useHealthAvailStore } from '@/store/health-avail-store'
import { MobileProductNav } from '@/components/layout/mobile-product-nav'

export default function HealthInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HealthInsurance />
    </Suspense>
  )
}

const HealthInsurance = () => {
  const router = useRouter()
  const params = useParams()
  const agentCode = params['agent-code'] as string
  const { clearCart } = useHealthCartStore()
  const { resetSteps } = useHealthAvailStore()

  // Clear stale cart and steps when landing on the main health insurance page
  useEffect(() => {
    clearCart()
    resetSteps()
  }, [])

  return (
    <div className="relative overflow-hidden pb-20 md:pb-0">
      {/* Shared mobile bottom nav + desktop chrome hiding + sidebar mount */}
      <MobileProductNav
        searchContent={<HealthProposalSearch />}
        searchTitle="Find Proposal"
        plansTargetId="health-plans"
      />

      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image
            src="/images/health-hero.jpg"
            alt="health-hero"
            className="aspect-video object-cover opacity-65"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fill
          />
          <div className="absolute inset-0 bg-black/80 dark:bg-black/30" />

          {/* Mobile-only brand logo — header is hidden on mobile by MobileProductNav */}
          <div className="absolute top-4 left-3 z-10 md:hidden">
            <a href={`/${agentCode}`} className="flex cursor-pointer rounded-tl-full rounded-br-full bg-white px-6 py-1 shadow-lg">
              <Image src="/images/logo.png" alt="One Insurance" width={256} height={63} className="h-7 w-auto" priority />
            </a>
          </div>
        </div>

        <div className="absolute top-0 right-3 max-h-16 max-w-16 rounded-b-xl bg-white px-2 py-1.5 sm:right-8 sm:max-h-24 sm:max-w-24 sm:rounded-b-2xl sm:px-3 sm:py-2 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1290} height={800} className="h-full w-full object-contain" />
        </div>

        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">
            Health Insurance
          </h1>
          <h2 className="hidden text-xl font-semibold text-slate-200 md:block md:text-2xl lg:text-3xl xl:text-4xl">
            for Modern Filipino Life
          </h2>
          <p className="max-w-[280px] text-xs leading-relaxed text-slate-300 md:max-w-[90%] md:text-base lg:max-w-2/5">
            Get reliable health insurance that covers major illnesses, medical
            emergencies, and essential care—so you're protected when it matters most.
          </p>
        </div>
      </div>

      {/* Get Personalized Advice form — scrolls to plans on submit */}
      <div className="relative z-20 mx-auto -mt-24 flex w-full max-w-7xl flex-col rounded-t-3xl border-t border-border bg-white px-5 pb-4 pt-6 shadow-2xl dark:border-slate-800 dark:bg-background md:-mt-28 md:gap-8 md:rounded-none md:border-0 md:bg-transparent md:px-4 md:pt-0 md:shadow-none lg:-mt-40 lg:gap-12">
        <style>{`
          @media (max-width: 767px) {
            [data-testid="health-details-form"] {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
            [data-testid="health-details-form"] > div {
              padding: 0 !important;
            }
          }
        `}</style>

        <HealthDetailsForm />
      </div>

      {/* Proposal Search — inline on desktop, in bottom-nav sheet on mobile */}
      <div className="mx-auto mt-8 hidden w-full max-w-7xl px-1.5 md:block">
        <HealthProposalSearch />
      </div>

      {/* Health Plans Grid — shown after Get Advice is clicked */}
      <div id="health-plans" className="mt-16">
        <HealthPlansGrid />
      </div>

      {/* Testimonials — hidden on mobile (low priority) */}
      <div className="hidden md:block">
        <HealthTestimonials />
      </div>

      {/* FAQs — hidden on mobile (low priority) */}
      <section className="hidden w-full bg-section py-16 md:block">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            <div className="space-y-4">
              <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-black text-transparent leading-tight">
                Got a question about Health Insurance in the Philippines?
              </h2>
              <p className="text-muted-foreground text-sm">
                Find answers to the most common questions about our health insurance plans
              </p>
              <div className="pt-6">
                <p className="text-muted-foreground mb-3 text-sm">
                  Still have questions? Our insurance experts are here to help.
                </p>
                <button className="from-primary to-accent rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-medium text-white">
                  Ask an Expert
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <FAQsSection faqs={HEALTH_FAQS} title="" description="" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
