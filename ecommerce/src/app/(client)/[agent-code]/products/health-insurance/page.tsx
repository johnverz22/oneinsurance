'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { PageLoader } from '@/components/page-loader'
import { FAQsSection } from '@/components/faqs-section'
import { HealthDetailsForm } from '@/components/health-insurance/health-details-form'
import { HealthPlansGrid } from '@/components/health-insurance/health-plans-grid'
import { HealthTestimonials } from '@/components/health-insurance/health-testimonials'
import { HealthProposalSearch } from '@/components/health-insurance/health-proposal-search'
import { HEALTH_FAQS } from '@/constants/faqs/health-insurance'

export default function HealthInsurancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HealthInsurance />
    </Suspense>
  )
}

const HealthInsurance = () => {
  const router = useRouter()

  return (
    <div className="relative overflow-hidden">
      <div className="relative h-[25rem] w-full md:h-[35rem] lg:h-[45rem]">
        <div className="relative h-full w-full">
          <Image
            src="/images/health-hero.jpg"
            alt="health-hero"
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
            <Image src="/images/logo.png" alt="One Insurance" width={140} height={45} className="h-10 w-auto" priority />
          </div>
          <div className="absolute inset-0 bg-black/80 dark:bg-black/30" />
        </div>

        <div className="absolute top-0 right-4 max-h-24 max-w-24 rounded-b-2xl bg-white px-3 py-2 sm:right-8 sm:max-h-32 sm:max-w-32 sm:px-4 sm:py-3 md:right-12 md:max-h-36 md:max-w-36 md:px-6 md:py-4 lg:right-20 lg:max-h-40 lg:max-w-40 lg:px-8 lg:py-4">
          <Image src="/images/IFRC.png" alt="IFRC Logo" width={1920} height={1240} className="h-full w-full object-contain" />
        </div>

        <div className="absolute inset-0 mx-auto -mt-8 flex h-full w-full max-w-7xl flex-col justify-center space-y-2.5 px-4 text-white lg:-mt-16">
          <h1 className="text-3xl font-black md:text-4xl lg:text-5xl xl:text-6xl">
            Health Insurance
          </h1>
          <h2 className="text-xl font-semibold md:text-2xl lg:text-3xl xl:text-4xl">
            for Modern Filipino Life
          </h2>
          <p className="max-w-4/5 text-sm md:text-base lg:max-w-2/5">
            Get reliable health insurance that covers major illnesses, medical
            emergencies, and essential care—so you're protected when it matters most.
          </p>
        </div>
      </div>

      {/* Get Personalized Advice form — scrolls to plans on submit */}
      <div className="relative mx-auto -mt-20 flex w-full max-w-7xl flex-col px-1.5 lg:-mt-40">
        <HealthDetailsForm />
      </div>

      {/* Proposal Search */}
      <div className="mx-auto mt-8 w-full max-w-7xl px-1.5">
        <HealthProposalSearch />
      </div>

      {/* Health Plans Grid — shown after Get Advice is clicked */}
      <div className="mt-16">
        <HealthPlansGrid />
      </div>

      {/* Testimonials */}
      <HealthTestimonials />

      {/* FAQs */}
      <section className="w-full bg-[#eef2f7] py-16">
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
