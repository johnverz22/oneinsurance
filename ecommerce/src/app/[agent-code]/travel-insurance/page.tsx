'use client'

import { useState, useEffect, use, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  Plane,
  CheckCircle2,
  FileCheck,
  CreditCard,
  FileText,
  Route,
  Scale,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { TripDetailsForm } from '@/components/travel-insurance/trip-details-form'
import { loadProposalIntoStore } from '@/utils/proposal-loader'
import type { RetrieveNotice } from '@/components/travel-insurance/proposal-retrieve'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ 'agent-code': string }>
}

interface FaqItem {
  id: string
  q: string
  a: string
}

const FAQS: FaqItem[] = [
  {
    id: 'what-does-travel-insurance-cover',
    q: 'What does travel insurance cover?',
    a: 'Depending on the plan, benefits may include emergency medical expenses, travel disruptions (cancellations and delays), lost or delayed baggage, and personal accident protection. Review your selected provider’s specific policy wording, limits, and exclusions before completing your purchase.',
  },
  {
    id: 'single-trip-or-annual-plan',
    q: 'Can I choose a single-trip or annual plan?',
    a: 'Yes. A single-trip plan covers one specific journey from departure to return. Annual multi-trip plans provide continuous coverage for unlimited journeys within 12 months, subject to per-trip duration caps. Confirm provider-specific eligibility during plan comparison.',
  },
  {
    id: 'domestic-travel-cover',
    q: 'Is this cover available for domestic travel?',
    a: 'Yes. Select Domestic for air travel within the Philippines, or International for overseas trips. Available coverage limits and benefits depend on your destination and provider. Cover is for scheduled commercial air travel only.',
  },
  {
    id: 'is-covid-19-covered',
    q: 'Is COVID-19 covered?',
    a: 'Selected comprehensive plans include emergency medical expenses and quarantine disruption caused by COVID-19. Review your chosen plan’s policy schedule to verify coverage conditions and limits before purchasing.',
  },
  {
    id: 'pre-existing-medical-conditions',
    q: 'Are pre-existing medical conditions covered?',
    a: 'Most standard travel policies exclude pre-existing medical conditions unless an optional medical endorsement or specialized rider is purchased. Always review the policy exclusion list and confirm eligibility with the insurer.',
  },
  {
    id: 'pregnancy-and-adventure-activities',
    q: 'What about pregnancy and adventure activities?',
    a: 'Routine pregnancy-related costs and extreme adventure sports (such as mountaineering or scuba diving below certain depths) usually require specialized add-on cover or are excluded. Check your policy schedule for specific activity guidelines.',
  },
  {
    id: 'cancellation-vs-interruption',
    q: 'What is the difference between cancellation and interruption?',
    a: 'Trip cancellation covers eligible non-refundable prepaid costs before departure. Trip interruption applies if you must cut short an ongoing trip due to a covered emergency after departure. Covered causes and reimbursement limits vary by underwriter.',
  },
  {
    id: 'baggage-lost-or-delayed',
    q: 'What happens if my baggage is lost or delayed?',
    a: 'If your checked baggage is delayed past the policy threshold (typically 6–12 hours) or permanently lost, you can claim emergency essential purchases or compensation up to the plan limit. Retain your airline Property Irregularity Report (PIR) and receipts.',
  },
  {
    id: 'medical-and-evacuation-benefits',
    q: 'What medical and emergency evacuation benefits are available?',
    a: 'Plans provide cashless hospital admission guarantees, doctor consultations, and medically supervised emergency evacuation back to the Philippines or the nearest medical facility. Contact the 24/7 assistance hotline listed on your policy for pre-approval.',
  },
  {
    id: 'including-family-members',
    q: 'Can I include my family members under one quote?',
    a: 'Yes. Select Family or update traveller counts in the quote form. Up to 10 travellers (adults and dependent children) can be quoted together in one unified proposal.',
  },
  {
    id: 'claims-and-emergency-assistance',
    q: 'How do I make a claim or get 24/7 emergency assistance?',
    a: 'Refer to the 24/7 assistance phone numbers and claims portal URL printed on your Certificate of Cover (eCOC). For medical emergencies, contact the assistance operator immediately for direct billing coordination.',
  },
  {
    id: 'retrieve-existing-proposal',
    q: 'Can I retrieve an existing proposal or policy?',
    a: 'Yes. Use the “Retrieve proposal” button in the header or form with your proposal reference number (e.g. MIC-TMPHPC2-261019-000001) to resume your saved quotation anytime.',
  },
]

export default function TravelInsuranceLandingPage({ params }: PageProps) {
  const { 'agent-code': agentCode } = use(params)
  const router = useRouter()
  const [retrieveOpen, setRetrieveOpen] = useState(false)
  const [retrievalNotice, setRetrievalNotice] = useState<RetrieveNotice>(null)
  const [proposalRef, setProposalRef] = useState('')
  const [retrieving, setRetrieving] = useState(false)

  // FAQ Accordion State with Deep-linking support
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({})
  const [showAllFaqsMobile, setShowAllFaqsMobile] = useState(false)

  // Deep-link to FAQ on mount if hash is present
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '')
    if (hash && FAQS.some((f) => f.id === hash)) {
      setOpenFaqs((prev) => ({ ...prev, [hash]: true }))
      setTimeout(() => {
        const el = document.getElementById(hash)
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [])

  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Focus and scroll to first form input
  const scrollToForm = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const formSection = document.getElementById('trip-search')
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => {
        const firstField = formSection.querySelector<HTMLElement>('button, input')
        firstField?.focus()
      }, 350)
    }
  }

  // Journey timeline animation
  useEffect(() => {
    const container = document.querySelector<HTMLElement>('[data-travel-journey]')
    if (!container) return

    const steps = Array.from(container.querySelectorAll<HTMLElement>('[data-journey-step]'))
    const markers = steps
      .map((s) => s.querySelector<HTMLElement>('[data-journey-marker]'))
      .filter(Boolean) as HTMLElement[]
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let rafId: number | null = null
    let state: Array<{ active: boolean; progress: number }> = []

    const update = () => {
      rafId = null
      const threshold = window.innerHeight * 0.75
      const markerCenters = markers.map((m) => {
        const rect = m.getBoundingClientRect()
        return rect.top + rect.height / 2
      })

      state = markerCenters.map((markerPos, i) => ({
        active: i === 0 || markerPos <= threshold,
        progress:
          i === markerCenters.length - 1
            ? 0
            : Math.max(0, Math.min(1, (threshold - markerPos) / (markerCenters[i + 1] - markerPos))),
      }))

      steps.forEach((step, idx) => {
        const itemState = state[idx]
        const isActive = reducedMotion.matches || idx === 0 || Boolean(itemState?.active)
        step.classList.toggle('is-active', isActive)
        step.style.setProperty(
          '--journey-progress',
          reducedMotion.matches ? '1' : String(itemState?.progress ?? 0)
        )
      })
      container.classList.add('is-enhanced')
    }

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    reducedMotion.addEventListener('change', scheduleUpdate)

    update()

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      reducedMotion.removeEventListener('change', scheduleUpdate)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  const submitRetrieval = async () => {
    const proposalNo = proposalRef.trim()
    if (!proposalNo || retrieving) return
    setRetrieving(true)
    setRetrievalNotice(null)
    const result = await loadProposalIntoStore(proposalNo)
    setRetrieving(false)
    if (result.status === 'ok') {
      setRetrieveOpen(false)
      router.push(
        `/${agentCode}/travel-insurance/review?proposal=${encodeURIComponent(result.proposalNo)}`
      )
      return
    }
    setRetrievalNotice({
      kind: result.status,
      message:
        result.status === 'issued' && result.policyNo
          ? `${result.message} Policy number: ${result.policyNo}.`
          : result.message,
    })
  }

  const handleRetrieveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitRetrieval()
  }

  // Build JSON-LD for FAQs
  const faqJsonLd = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    }
  }, [])

  // Split FAQs for independent 2-column desktop stack
  const col1Faqs = FAQS.slice(0, 6)
  const col2Faqs = FAQS.slice(6)
  const visibleMobileFaqs = showAllFaqsMobile ? FAQS : FAQS.slice(0, 5)

  return (
    <div className="min-h-screen bg-[#fcfdfb] font-sans text-base text-[#183d2c] antialiased dark:bg-[#1c1e1e] dark:text-[#f4f5f2]">
      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Accessible Skip Link */}
      <a
        href="#main"
        className="sr-only fixed top-3 left-3 z-50 rounded-md bg-[#006838] px-4 py-3 text-white focus:not-sr-only focus:outline-2 focus:outline-white"
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header
        agentCode={agentCode}
        currentStep={1}
        onOpenRetrieveModal={() => setRetrieveOpen(true)}
      />

      <main id="main" tabIndex={-1} className="focus:outline-hidden">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-title"
          className="travel-one-hero dark:bg-[#171919]"
        >
          <div className="travel-one-hero__inner">
            <div className="travel-one-hero__copy">
              <h1
                id="hero-title"
                className="text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-[clamp(2.5rem,5vw,3.75rem)] leading-tight tracking-tight text-[#183d2c] dark:text-[#f4f5f2] [text-wrap:balance]"
              >
                Enjoy every<br className="hidden sm:inline" /> part of your<br className="hidden sm:inline" />{' '}
                <span className="text-[#006838] dark:text-[#d0e3c8]">journey.</span>
              </h1>
              <p className="mx-auto mt-3 sm:mt-4 max-w-md text-sm sm:text-base leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5] lg:mx-0">
                A weekend getaway or a long-awaited adventure. Compare accredited plans with clear benefits and comprehensive protection.
              </p>
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:focus-visible:outline-white shadow-xs"
                >
                  <span>Get a quote</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:text-white"
                >
                  How it works →
                </a>
              </div>
            </div>
          </div>

          <figure className="travel-one-hero__art flex items-center justify-center mx-auto">
            <div aria-hidden="true" className="travel-one-hero__blob travel-one-hero__blob--green" />
            <div aria-hidden="true" className="travel-one-hero__blob travel-one-hero__blob--cream" />
            <Image
              src="/storage/img/travel-insurance-img-1.png"
              alt="Friends enjoying a road trip together in an open-top vehicle"
              width={1495}
              height={1052}
              priority
              className="travel-one-hero__image object-cover mx-auto"
            />
          </figure>
          <div aria-hidden="true" className="travel-one-hero__blob travel-one-hero__blob--small" />
        </section>

        {/* Quote Form ("Your trip details") — Positioned directly following hero for immediate fold visibility */}
        <TripDetailsForm
          agentCode={agentCode}
          onOpenRetrieve={() => setRetrieveOpen(true)}
        />

        {/* Slim Trust Strip */}
        <section aria-label="Insurance accreditations and starting rates" className="border-y border-[#dfe7df] bg-white py-4 dark:border-[#3d4140] dark:bg-[#171919]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 text-xs sm:text-sm text-[#333333] dark:text-[#c4c7c5]">
            <div className="flex items-center gap-2 font-semibold text-[#006838] dark:text-[#d0e3c8]">
              <span className="rounded-full bg-[#e2eddb] px-2.5 py-1 text-xs font-bold text-[#006838] dark:bg-[#304538] dark:text-[#f4f5f2]">
                From ₱299
              </span>
              <span>Comprehensive protection per trip</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#808080] dark:text-[#b2b7b4]">
              <span className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">Underwritten by:</span>
              <span className="font-medium text-[#333333] dark:text-[#c4c7c5]">Pacific Cross · Oona · Malayan</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#808080] dark:text-[#b2b7b4]">
              <ShieldCheck className="size-4 text-[#006838] dark:text-[#d0e3c8]" aria-hidden="true" />
              <span>Licensed by Insurance Commission · Lic. 2024/01-R</span>
            </div>
          </div>
        </section>

        {/* Coverage Section (Benefit Cards) */}
        <section
          id="coverage"
          aria-labelledby="coverage-title"
          className="travel-one-coverage scroll-mt-20 bg-[#fcfdfb] dark:bg-[#1c1e1e]"
        >
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
                Key Coverages
              </p>
              <h2
                id="coverage-title"
                className="mt-2 text-2xl font-bold tracking-tight leading-tight text-[#183d2c] dark:text-[#f4f5f2] sm:text-4xl"
              >
                Cover for the journey ahead.
              </h2>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5]">
                Compare verified benefits that protect against unexpected travel delays, medical concerns, and baggage disruptions.
              </p>
            </div>

            {/* 2x2 grid on SM/MD, 4-column on LG, 1px border and AA contrast */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {/* Benefit 1: Medical */}
              <article className="travel-one-benefit flex flex-col h-full rounded-lg border border-[#dfe7df] bg-white p-4 sm:p-6 shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="travel-one-benefit__icon inline-flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                  <Image
                    src="/images/mockups/travel-insurance/shared/icons/first-aid-kit.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="size-5 sm:size-6 dark:invert"
                  />
                </span>
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-bold leading-tight text-[#006838] dark:text-[#f4f5f2]">
                  Medical emergencies
                </h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                  Cashless hospitalisation, outpatient consultations, and emergency repatriation while away from home.
                </p>
              </article>

              {/* Benefit 2: Disruptions */}
              <article className="travel-one-benefit flex flex-col h-full rounded-lg border border-[#dfe7df] bg-white p-4 sm:p-6 shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="travel-one-benefit__icon inline-flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                  <Image
                    src="/images/mockups/travel-insurance/shared/icons/plane.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="size-5 sm:size-6 dark:invert"
                  />
                </span>
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-bold leading-tight text-[#006838] dark:text-[#f4f5f2]">
                  Trip disruptions
                </h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                  Reimbursement for covered flight delays, cancellations, and trip interruptions before and during travel.
                </p>
              </article>

              {/* Benefit 3: Baggage */}
              <article className="travel-one-benefit flex flex-col h-full rounded-lg border border-[#dfe7df] bg-white p-4 sm:p-6 shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="travel-one-benefit__icon inline-flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                  <Image
                    src="/images/mockups/travel-insurance/shared/icons/luggage.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="size-5 sm:size-6 dark:invert"
                  />
                </span>
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-bold leading-tight text-[#006838] dark:text-[#f4f5f2]">
                  Baggage & personal effects
                </h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                  Allowances for delayed luggage after 6 hours and compensation for damaged or lost belongings.
                </p>
              </article>

              {/* Benefit 4: Accident */}
              <article className="travel-one-benefit flex flex-col h-full rounded-lg border border-[#dfe7df] bg-white p-4 sm:p-6 shadow-xs dark:border-[#3d4140] dark:bg-[#262828]">
                <span className="travel-one-benefit__icon inline-flex size-10 sm:size-12 items-center justify-center rounded-xl bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                  <Image
                    src="/images/mockups/travel-insurance/shared/icons/shield-check.svg"
                    alt=""
                    width={28}
                    height={28}
                    className="size-5 sm:size-6 dark:invert"
                  />
                </span>
                <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-bold leading-tight text-[#006838] dark:text-[#f4f5f2]">
                  Personal accident
                </h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                  Lump-sum benefits and accidental death & disablement protection up to plan maximums.
                </p>
              </article>
            </div>

            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-snug sm:leading-normal text-[#808080] dark:text-[#b2b7b4]">
              Benefits depend on the selected underwriter and plan tier. Review the policy wording, conditions, and exclusions prior to purchasing.
            </p>
          </div>
        </section>

        {/* How It Works Section ("From trip details to take-off") */}
        <section
          id="how-it-works"
          aria-labelledby="steps-title"
          className="w-full scroll-mt-20 border-t border-[#dfe7df] bg-white px-5 py-12 dark:border-[#3d4140] dark:bg-[#171919] sm:px-8 sm:py-16 lg:px-12 lg:py-24"
        >
          <div className="mx-auto max-w-7xl grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
            {/* Phone Mockup — "More time for what matters." */}
            <div className="family-phone-stage min-w-0 max-w-full justify-self-center lg:justify-self-start">
              <div className="family-phone">
                <section
                  tabIndex={0}
                  aria-labelledby="why-title"
                  aria-label="Travel information inside the phone; scroll to read more"
                  className="family-phone__screen bg-white text-[#183d2c] dark:bg-[#262828] dark:text-[#f4f5f2]"
                >
                  <figure className="relative">
                    <Image
                      src="/images/mockups/travel-insurance/one/family-seaside.png"
                      alt="A Filipino family enjoying a quiet walk together along the beach"
                      width={1672}
                      height={941}
                      className="aspect-[4/3] w-full object-cover object-[65%_center]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                    />
                  </figure>

                  <div className="p-6">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
                      One Insurance · Travel
                    </p>
                    <h2 id="why-title" className="mt-1.5 font-semibold tracking-tight">
                      More time for what matters.
                    </h2>
                    <p className="mt-2 text-[#333333] dark:text-[#c4c7c5]">
                      Choose your cover. Enjoy the people and places ahead.
                    </p>

                    <dl className="mt-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                          <Scale className="size-4" aria-hidden />
                        </span>
                        <div>
                          <dt className="font-semibold">Clear choices</dt>
                          <dd className="mt-0.5 text-[#333333] dark:text-[#c4c7c5]">
                            Compare cover, limits, and terms.
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                          <Route className="size-4" aria-hidden />
                        </span>
                        <div>
                          <dt className="font-semibold">One simple journey</dt>
                          <dd className="mt-0.5 text-[#333333] dark:text-[#c4c7c5]">
                            From trip details to policy, in one place.
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e2eddb] text-[#006838] dark:bg-[#304538] dark:text-[#d0e3c8]">
                          <FileText className="size-4" aria-hidden />
                        </span>
                        <div>
                          <dt className="font-semibold">Details close by</dt>
                          <dd className="mt-0.5 text-[#333333] dark:text-[#c4c7c5]">
                            Keep your policy and assistance contacts handy.
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </div>
                </section>
              </div>
            </div>

            {/* 5 Steps to Cover Details */}
            <div className="min-w-0">
              <h2
                id="steps-title"
                className="text-2xl font-bold tracking-tight text-[#183d2c] dark:text-[#f4f5f2] sm:text-3xl lg:text-4xl [text-wrap:balance]"
              >
                From trip details to take&#8209;off.
              </h2>
              <p className="mt-2 sm:mt-3 max-w-xl text-sm leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5] sm:text-base">
                Five straightforward steps from selecting your destinations to receiving your official policy and certificate.
              </p>

              <ol data-travel-journey className="travel-journey mt-6 sm:mt-8">
                {/* Step 1 */}
                <li data-journey-step className="travel-journey__step is-active">
                  <span data-journey-marker className="travel-journey__marker" aria-hidden="true">
                    <Plane className="size-5" />
                  </span>
                  <div className="travel-journey__panel">
                    <h3 className="travel-journey__title text-base font-semibold sm:text-lg">
                      <span className="sr-only">Step 1: </span>1. Trip details
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                      Enter your destination, departure and return dates, and traveller count.
                    </p>
                  </div>
                </li>

                {/* Step 2 */}
                <li data-journey-step className="travel-journey__step">
                  <span data-journey-marker className="travel-journey__marker" aria-hidden="true">
                    <FileCheck className="size-5" />
                  </span>
                  <div className="travel-journey__panel">
                    <h3 className="travel-journey__title text-base font-semibold sm:text-lg">
                      <span className="sr-only">Step 2: </span>2. Choose a plan
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                      Compare live plans side by side, review medical limits and Schengen eligibility, then choose your tier.
                    </p>
                  </div>
                </li>

                {/* Step 3 */}
                <li data-journey-step className="travel-journey__step">
                  <span data-journey-marker className="travel-journey__marker" aria-hidden="true">
                    <FileText className="size-5" />
                  </span>
                  <div className="travel-journey__panel">
                    <h3 className="travel-journey__title text-base font-semibold sm:text-lg">
                      <span className="sr-only">Step 3: </span>3. Generate quote
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                      Add optional riders and fill in traveller passport & beneficiary details to create your proposal.
                    </p>
                  </div>
                </li>

                {/* Step 4 */}
                <li data-journey-step className="travel-journey__step">
                  <span data-journey-marker className="travel-journey__marker" aria-hidden="true">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div className="travel-journey__panel">
                    <h3 className="travel-journey__title text-base font-semibold sm:text-lg">
                      <span className="sr-only">Step 4: </span>4. Review quote
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                      Inspect your locked proposal, verify traveller information, and confirm the final premium.
                    </p>
                  </div>
                </li>

                {/* Step 5 */}
                <li data-journey-step className="travel-journey__step">
                  <span data-journey-marker className="travel-journey__marker" aria-hidden="true">
                    <CreditCard className="size-5" />
                  </span>
                  <div className="travel-journey__panel">
                    <h3 className="travel-journey__title text-base font-semibold sm:text-lg">
                      <span className="sr-only">Step 5: </span>5. Payment & issuance
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-snug sm:leading-normal text-[#333333] dark:text-[#c4c7c5]">
                      Pay via GCash, Maya, cards, or bank channels and instantly download your Certificate of Cover (eCOC).
                    </p>
                  </div>
                </li>
              </ol>

              {/* End of Journey CTA */}
              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006838] px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:focus-visible:outline-white shadow-xs transition"
                >
                  <span>Start with your trip details</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section
          id="faqs"
          aria-labelledby="faq-title"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
        >
          <div className="rounded-2xl border border-[#dfe7df] bg-white p-5 sm:p-8 lg:p-12 dark:border-[#3d4140] dark:bg-[#262828] shadow-xs">
            <span className="inline-flex rounded-full bg-[#f1f2f0] px-3 py-1 text-xs font-bold text-[#006838] dark:bg-[#303232] dark:text-[#d0e3c8]">
              FAQs
            </span>
            <h2
              id="faq-title"
              className="mt-3 text-2xl font-bold tracking-tight text-[#183d2c] dark:text-[#f4f5f2] sm:text-3xl lg:text-4xl"
            >
              Frequently asked questions
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5] sm:text-base">
              Key questions about coverage, eligibility, and claims. Your selected policy wording remains the authoritative source.
            </p>

            {/* Mobile / Tablet Single Column Stack (Shows first 5 + expand button on SM) */}
            <div className="mt-8 lg:hidden divide-y divide-[#dfe7df] dark:divide-[#3d4140]">
              {visibleMobileFaqs.map((faq) => {
                const isOpen = Boolean(openFaqs[faq.id])
                const panelId = `faq-panel-${faq.id}`
                const buttonId = `faq-btn-${faq.id}`

                return (
                  <div key={faq.id} id={faq.id} className="py-2">
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleFaq(faq.id)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 text-left py-2 text-sm font-semibold text-[#183d2c] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:text-[#d0e3c8]"
                    >
                      <span className="pr-2">{faq.q}</span>
                      <ChevronDown
                        className={cn(
                          'size-5 shrink-0 text-[#808080] transition-transform duration-200 dark:text-[#b2b7b4]',
                          isOpen && 'rotate-180 text-[#006838] dark:text-[#d0e3c8]'
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="pt-1 pb-3 text-xs sm:text-sm leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5]"
                      >
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}

              {!showAllFaqsMobile && FAQS.length > 5 && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllFaqsMobile(true)}
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#006838] px-5 py-2 text-xs sm:text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232] transition"
                  >
                    Show all {FAQS.length} questions
                  </button>
                </div>
              )}
            </div>

            {/* Desktop 2 Independent Columns Stack (items-start so height expansions never shift sibling column) */}
            <div className="mt-10 hidden lg:grid lg:grid-cols-2 lg:gap-12 items-start">
              {/* Column 1 */}
              <div className="divide-y divide-[#dfe7df] dark:divide-[#3d4140]">
                {col1Faqs.map((faq) => {
                  const isOpen = Boolean(openFaqs[faq.id])
                  const panelId = `faq-panel-col1-${faq.id}`
                  const buttonId = `faq-btn-col1-${faq.id}`

                  return (
                    <div key={faq.id} id={faq.id} className="py-2.5">
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggleFaq(faq.id)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 text-left py-2 text-sm font-semibold text-[#183d2c] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:text-[#d0e3c8]"
                      >
                        <span className="pr-2">{faq.q}</span>
                        <ChevronDown
                          className={cn(
                            'size-5 shrink-0 text-[#808080] transition-transform duration-200 dark:text-[#b2b7b4]',
                            isOpen && 'rotate-180 text-[#006838] dark:text-[#d0e3c8]'
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="pt-1 pb-3 text-sm leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5]"
                        >
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Column 2 */}
              <div className="divide-y divide-[#dfe7df] dark:divide-[#3d4140]">
                {col2Faqs.map((faq) => {
                  const isOpen = Boolean(openFaqs[faq.id])
                  const panelId = `faq-panel-col2-${faq.id}`
                  const buttonId = `faq-btn-col2-${faq.id}`

                  return (
                    <div key={faq.id} id={faq.id} className="py-2.5">
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggleFaq(faq.id)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 text-left py-2 text-sm font-semibold text-[#183d2c] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:text-[#d0e3c8]"
                      >
                        <span className="pr-2">{faq.q}</span>
                        <ChevronDown
                          className={cn(
                            'size-5 shrink-0 text-[#808080] transition-transform duration-200 dark:text-[#b2b7b4]',
                            isOpen && 'rotate-180 text-[#006838] dark:text-[#d0e3c8]'
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="pt-1 pb-3 text-sm leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5]"
                        >
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Back to trip details link */}
            <div className="mt-8 border-t border-[#dfe7df] pt-6 dark:border-[#3d4140]">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006838] underline underline-offset-4 hover:text-[#00552e] dark:text-[#d0e3c8] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-[#006838]"
              >
                <span>Back to trip details</span>
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Retrieve Proposal Dialog / Modal */}
      {retrieveOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="retrieve-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#dfe7df] bg-white p-6 text-[#183d2c] shadow-2xl dark:border-[#3d4140] dark:bg-[#262828] dark:text-[#f4f5f2] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
                  Pick up where you left off
                </p>
                <h2 id="retrieve-title" className="mt-1 text-2xl font-bold tracking-tight">
                  Retrieve your proposal.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRetrieveOpen(false)
                  setRetrievalNotice(null)
                }}
                aria-label="Close proposal retrieval"
                className="inline-flex size-11 items-center justify-center rounded-md text-2xl text-[#808080] hover:bg-[#f1f2f0] hover:text-[#183d2c] dark:hover:bg-[#303232] dark:hover:text-white focus-visible:outline-2 focus-visible:outline-[#006838]"
              >
                ×
              </button>
            </div>

            <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-snug sm:leading-relaxed text-[#333333] dark:text-[#c4c7c5]">
              Enter your proposal reference to review your saved quote and proceed to policy payment.
            </p>

            <form onSubmit={handleRetrieveSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="proposal-reference" className="text-sm font-medium">
                  Proposal or policy reference
                </label>
                <input
                  id="proposal-reference"
                  name="reference"
                  value={proposalRef}
                  onChange={(e) => setProposalRef(e.target.value)}
                  required
                  disabled={retrieving}
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="e.g. MIC-TMPHPC2-261019-000001"
                  className="ui-form-field mt-2 block min-h-12 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-base text-[#183d2c] placeholder:text-[#808080] focus:border-[#006838] focus:outline-2 focus:outline-[#006838] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2] dark:placeholder:text-[#b2b7b4] dark:focus:border-[#006838]"
                />
              </div>

              <button
                type="submit"
                disabled={retrieving}
                className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-3 text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:opacity-50 dark:focus-visible:outline-white"
              >
                {retrieving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Retrieving…
                  </>
                ) : (
                  'Retrieve proposal'
                )}
              </button>

              {retrievalNotice && (
                <div
                  role="alert"
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
                    retrievalNotice.kind === 'unavailable'
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/10'
                      : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10'
                  )}
                >
                  <AlertCircle
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      retrievalNotice.kind === 'unavailable'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                    aria-hidden
                  />
                  <div
                    className={
                      retrievalNotice.kind === 'unavailable'
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-red-800 dark:text-red-300'
                    }
                  >
                    <p>{retrievalNotice.message}</p>
                    {retrievalNotice.kind === 'unavailable' && (
                      <button
                        type="button"
                        onClick={() => void submitRetrieval()}
                        className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"
                      >
                        <RefreshCw className="size-3.5" aria-hidden />
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
