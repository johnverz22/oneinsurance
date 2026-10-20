'use client'

import Link from 'next/link'
import { ArrowLeft, Bell, Clock, ShieldCheck, Sparkles, WifiOff, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface HoldingPageProps {
  productSlug?: string
  productName?: string
  agentCode?: string
  reason?: 'product' | 'backend'
}

export function HoldingPage({
  productSlug = 'coming-soon',
  productName = 'Insurance Coverage',
  agentCode = 'ckO6uNx2O6',
  reason = 'product',
}: HoldingPageProps) {
  if (reason === 'backend') {
    return (
      <div className="flex min-h-dvh flex-col bg-[#fcfdfb] text-[#183d2c] dark:bg-[#171919] dark:text-[#f4f5f2]">
        <Header
          agentCode={agentCode}
          currentProductSlug={productSlug}
          currentProductName={productName}
        />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-[#dfe7df] bg-white p-8 text-center shadow-xl dark:border-[#3d4140] dark:bg-[#262828]">
            <div className="relative mb-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <WifiOff className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-red-600">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-bold">System Unavailable</h1>
            <p className="mb-6 leading-relaxed text-sm text-[#505553] dark:text-[#b2b7b4]">
              Our insurance quotation services are temporarily undergoing maintenance. Please check back shortly.
            </p>

            <Link
              href={`/${agentCode}/travel-insurance`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00502b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </main>
        <Footer agentCode={agentCode} />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#fcfdfb] text-[#183d2c] dark:bg-[#171919] dark:text-[#f4f5f2]">
      <Header
        agentCode={agentCode}
        currentProductSlug={productSlug}
        currentProductName={productName}
      />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:py-24">
        {/* Soft background accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,104,56,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,104,56,0.22),transparent_70%)]"
        />

        <div className="mx-auto w-full max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#006838]/20 bg-[#e2eddb]/70 px-4 py-1.5 text-xs font-semibold text-[#006838] dark:border-[#006838]/40 dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
            <Clock className="h-3.5 w-3.5" />
            <span>Product In Development</span>
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {productName}
            <span className="block text-[#006838] dark:text-[#d0e3c8]">Coming Soon</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#505553] sm:text-lg dark:text-[#b2b7b4]">
            We&apos;re actively building and certifying the{' '}
            <strong className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
              {productName}
            </strong>{' '}
            experience for One Insurance. Explore our live travel insurance plans in the meantime, or sign up as an agent.
          </p>

          {/* Feature Highlights Grid */}
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-[#dfe7df] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-[#3d4140] dark:bg-[#262828]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006838]/10 text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-base text-[#183d2c] dark:text-[#f4f5f2]">
                Get Notified
              </h3>
              <p className="mt-1 text-center text-xs leading-5 text-[#505553] dark:text-[#b2b7b4]">
                Be the first to access quotes and instant digital applications when launched.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-[#dfe7df] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-[#3d4140] dark:bg-[#262828]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006838]/10 text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-base text-[#183d2c] dark:text-[#f4f5f2]">
                Tailored Protection
              </h3>
              <p className="mt-1 text-center text-xs leading-5 text-[#505553] dark:text-[#b2b7b4]">
                Backed by leading underwriters with comprehensive, reliable claim benefits.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-[#dfe7df] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-[#3d4140] dark:bg-[#262828]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#006838]/10 text-[#006838] dark:bg-[#006838]/20 dark:text-[#d0e3c8]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-base text-[#183d2c] dark:text-[#f4f5f2]">
                Instant Issuance
              </h3>
              <p className="mt-1 text-center text-xs leading-5 text-[#505553] dark:text-[#b2b7b4]">
                Digital policy documents and automated certificates delivered in minutes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={`/${agentCode}/travel-insurance`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#006838] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#00502b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explore Travel Insurance</span>
            </Link>

            <Link
              href="/agent-application"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[#006838] px-6 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] sm:w-auto dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:focus-visible:outline-white"
            >
              <span>Become an Agent</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer agentCode={agentCode} />
    </div>
  )
}
