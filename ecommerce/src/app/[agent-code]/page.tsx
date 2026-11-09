'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  Car,
  Clock,
  FileCheck,
  HardHat,
  HeartPulse,
  Plane,
  ShieldCheck,
  Ship,
  type LucideIcon,
} from 'lucide-react'

import { Header, PRODUCTS_CONFIG } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { PRODUCT_FLAGS } from '@/lib/product-flags'
import { resolveAgentCode } from '@/lib/agent-code'

const PRODUCT_DETAILS: Record<string, { icon: LucideIcon; blurb: string }> = {
  'travel-insurance': {
    icon: Plane,
    blurb:
      'Emergency medical cover, trip delays and baggage protection for domestic and international trips.',
  },
  'health-insurance': {
    icon: HeartPulse,
    blurb: 'Medical and hospital coverage for individuals, families and senior citizens.',
  },
  'ctpl-insurance': {
    icon: Car,
    blurb: 'Compulsory third-party liability cover required for LTO vehicle registration.',
  },
  'marine-cargo-insurance': {
    icon: Ship,
    blurb: 'Protection for goods and cargo in transit by sea, air or land.',
  },
  'engineering-insurance': {
    icon: HardHat,
    blurb: 'Cover for construction projects, contractors’ equipment and engineering risks.',
  },
  'specialized-insurance': {
    icon: ShieldCheck,
    blurb: 'Mandatory and specialized lines for unique business and regulatory requirements.',
  },
}

export default function AgentLandingPage() {
  const params = useParams()
  const agentCode = resolveAgentCode(params['agent-code'] as string)

  return (
    <div className="flex min-h-dvh flex-col bg-[#fcfdfb] font-sans text-base text-[#183d2c] antialiased dark:bg-[#1c1e1e] dark:text-[#f4f5f2]">
      {/* Accessible Skip Link */}
      <a
        href="#main"
        className="sr-only fixed top-3 left-3 z-50 rounded-md bg-[#006838] px-4 py-3 text-white focus:not-sr-only focus:outline-2 focus:outline-white"
      >
        Skip to main content
      </a>

      <Header
        agentCode={agentCode}
        currentProductSlug="home"
        productsLabel="Products"
      />

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-hidden">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="travel-one-hero dark:bg-[#171919]">
          <div className="mx-auto max-w-3xl px-5 pt-14 pb-16 text-center sm:px-8 sm:pt-20 sm:pb-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#006838]/20 bg-[#e2eddb]/70 px-4 py-1.5 text-xs font-semibold text-[#006838] dark:border-[#006838]/40 dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>One Insurance · A brand of IFRC Insurance</span>
            </span>
            <h1
              id="hero-title"
              className="mt-6 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Clear choices.{' '}
              <span className="text-[#006838] dark:text-[#d0e3c8]">Cover for what matters.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#333333] sm:text-base dark:text-[#c4c7c5]">
              Compare accredited insurance plans for travel, health, motor, cargo and more —
              get a quote online and receive your policy digitally in minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={`/${agentCode}/travel-insurance`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-base font-semibold text-white shadow-xs hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] active:bg-[#004525] sm:w-auto dark:focus-visible:outline-white"
              >
                <span>Get a travel quote</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href="#products"
                className="inline-flex min-h-12 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:text-white"
              >
                Browse all products →
              </a>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section
          aria-label="Insurance accreditations"
          className="border-y border-[#dfe7df] bg-white py-4 dark:border-[#3d4140] dark:bg-[#171919]"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 text-xs text-[#333333] sm:px-8 sm:text-sm lg:px-12 dark:text-[#c4c7c5]">
            <div className="flex items-center gap-2 font-semibold text-[#006838] dark:text-[#d0e3c8]">
              <span className="rounded-full bg-[#e2eddb] px-2.5 py-1 text-xs font-bold text-[#006838] dark:bg-[#304538] dark:text-[#f4f5f2]">
                From ₱299
              </span>
              <span>Comprehensive protection per trip</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#808080] sm:gap-4 dark:text-[#b2b7b4]">
              <span className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Underwritten by:</span>
              <span className="font-medium text-[#333333] dark:text-[#c4c7c5]">
                Pacific Cross · Oona · Malayan
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#808080] dark:text-[#b2b7b4]">
              <ShieldCheck className="size-4 text-[#006838] dark:text-[#d0e3c8]" aria-hidden="true" />
              <span>Licensed by Insurance Commission · Lic. 2024/01-R</span>
            </div>
          </div>
        </section>

        {/* Products */}
        <section
          id="products"
          aria-labelledby="products-title"
          className="scroll-mt-24 bg-[#fcfdfb] dark:bg-[#1c1e1e]"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold tracking-wider text-[#006838] uppercase dark:text-[#d0e3c8]">
                Our products
              </p>
              <h2
                id="products-title"
                className="mt-2 text-2xl leading-tight font-bold tracking-tight text-[#183d2c] sm:text-4xl dark:text-[#f4f5f2]"
              >
                Cover for every journey, asset and business.
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[#333333] sm:mt-3 sm:text-base dark:text-[#c4c7c5]">
                Pick a product to compare plans from verified underwriters and apply online.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {PRODUCTS_CONFIG.map((product) => {
                const details = PRODUCT_DETAILS[product.slug]
                const Icon = details?.icon ?? ShieldCheck
                const isEnabled = PRODUCT_FLAGS[product.flagKey] ?? false

                return (
                  <Link
                    key={product.slug}
                    href={`/${agentCode}/${product.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-[#dfe7df] bg-white p-5 shadow-xs transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] sm:p-6 dark:border-[#3d4140] dark:bg-[#262828] dark:focus-visible:outline-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[#e2eddb] text-[#006838] sm:size-12 dark:bg-[#304538] dark:text-[#d0e3c8]">
                        <Icon className="size-5 sm:size-6" aria-hidden="true" />
                      </span>
                      {!isEnabled && (
                        <span className="rounded-full bg-[#f1f2f0] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#808080] uppercase dark:bg-[#303232] dark:text-[#b2b7b4]">
                          Soon
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-[#183d2c] sm:text-lg dark:text-[#f4f5f2]">
                      {product.name}
                    </h3>
                    <p className="mt-1 flex-1 text-base leading-relaxed text-[#505553] dark:text-[#b2b7b4]">
                      {details?.blurb}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#006838] dark:text-[#d0e3c8]">
                      {isEnabled ? 'Get a quote' : 'Learn more'}
                      <ArrowUpRight
                        className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                )
              })}
            </div>

            <p className="mt-6 text-center text-sm text-[#505553] dark:text-[#b2b7b4]">
              Curious who backs our plans?{' '}
              <Link
                href={`/${agentCode}/providers`}
                className="font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:focus-visible:outline-white"
              >
                Meet our providers →
              </Link>
            </p>
          </div>
        </section>

        {/* Why One Insurance */}
        <section
          aria-labelledby="why-title"
          className="border-t border-[#dfe7df] bg-white dark:border-[#3d4140] dark:bg-[#171919]"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold tracking-wider text-[#006838] uppercase dark:text-[#d0e3c8]">
                Why One Insurance
              </p>
              <h2
                id="why-title"
                className="mt-2 text-2xl leading-tight font-bold tracking-tight text-[#183d2c] sm:text-4xl dark:text-[#f4f5f2]"
              >
                Protection without the paperwork.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-6">
              <article className="flex flex-col items-center rounded-2xl border border-[#dfe7df] bg-[#fcfdfb] p-6 text-center shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#006838]/10 text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                  Licensed &amp; accredited
                </h3>
                <p className="mt-1 text-base leading-relaxed text-[#505553] dark:text-[#b2b7b4]">
                  Regulated by the Insurance Commission (Lic. 2024/01-R) and underwritten by
                  Pacific Cross, Oona and Malayan.
                </p>
              </article>

              <article className="flex flex-col items-center rounded-2xl border border-[#dfe7df] bg-[#fcfdfb] p-6 text-center shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#006838]/10 text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
                  <FileCheck className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                  Instant digital issuance
                </h3>
                <p className="mt-1 text-base leading-relaxed text-[#505553] dark:text-[#b2b7b4]">
                  Quote, pay and receive your e-policy and official receipt in minutes — no
                  branch visits, no paperwork.
                </p>
              </article>

              <article className="flex flex-col items-center rounded-2xl border border-[#dfe7df] bg-[#fcfdfb] p-6 text-center shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#006838]/10 text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
                  <Clock className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                  24/7 emergency assistance
                </h3>
                <p className="mt-1 text-base leading-relaxed text-[#505553] dark:text-[#b2b7b4]">
                  Round-the-clock claims and emergency hotlines printed on every Certificate
                  of Cover.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section aria-labelledby="cta-title" className="bg-[#006838] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-12 text-center sm:px-8 sm:py-16 lg:px-12">
            <h2 id="cta-title" className="max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              Ready when you are.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-base">
              Get covered in minutes — or join our network and sell One Insurance products to
              your own clients.
            </p>
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                href={`/${agentCode}/travel-insurance`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                <span>Get a travel quote</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/agent-application"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-white/70 px-6 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                <span>Become an agent</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer agentCode={agentCode} />
    </div>
  )
}
