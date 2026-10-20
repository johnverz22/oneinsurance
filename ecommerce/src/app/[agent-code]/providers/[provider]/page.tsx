import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import { ArrowLeft } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { COMPANIES } from '@/constants/companies'

interface PageProps {
  params: Promise<{ 'agent-code': string; provider: string }>
}

export function generateStaticParams() {
  return COMPANIES.map((company) => ({ provider: company.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provider } = await params
  const company = COMPANIES.find((c) => c.id === provider)
  if (!company) return { title: 'One Insurance — Our Providers' }
  return {
    title: `One Insurance — ${company.companyName}`,
    description: company.description.replace(/<[^>]*>/g, ''),
  }
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const { 'agent-code': agentCode, provider } = await params
  const company = COMPANIES.find((c) => c.id === provider)
  if (!company) notFound()

  const homePath = `/${agentCode}/travel-insurance`
  const basePath = `/${agentCode}/providers`

  const navItems = [
    { label: 'Travel Insurance', href: homePath },
    { label: 'Become an Agent', href: '/agent-application' },
    { label: 'Contact', href: '#footer' },
  ]

  return (
    <div className="min-h-screen bg-[#fcfdfb] font-sans text-base text-[#183d2c] antialiased dark:bg-[#1c1e1e] dark:text-[#f4f5f2]">
      <a
        href="#main"
        className="sr-only fixed top-3 left-3 z-50 rounded-md bg-[#006838] px-4 py-3 text-white focus:not-sr-only"
      >
        Skip to content
      </a>

      <Header
        agentCode={agentCode}
        currentProductSlug="travel-insurance"
        currentProductName="Our Providers"
        customNavItems={navItems}
      />

      <main id="main">
        {/* Banner */}
        <section className="bg-[#006838] text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:justify-between lg:py-16">
            <div className="max-w-2xl text-center lg:text-left">
              <Link
                href={basePath}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-[#d0e3c8] hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ArrowLeft aria-hidden className="size-4" />
                All providers
              </Link>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {company.companyName}
              </h1>
              {company.tagLine && (
                <p className="mt-3 text-lg leading-8 text-[#d0e3c8]">
                  {company.tagLine}
                </p>
              )}
            </div>

            <div className="w-full max-w-sm flex-none rounded-lg bg-white p-6 shadow-xl">
              <div className="relative h-32 w-full sm:h-40">
                <Image
                  src={company.image}
                  alt={`${company.companyName} logo`}
                  fill
                  priority
                  sizes="(max-width: 640px) 90vw, 384px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section
          aria-labelledby="about-provider"
          className="bg-[#fcfdfb] dark:bg-[#1c1e1e]"
        >
          <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
              Provider profile
            </p>
            <h2
              id="about-provider"
              className="mt-3 text-2xl font-bold tracking-tight text-[#183d2c] dark:text-[#f4f5f2] sm:text-3xl"
            >
              About {company.companyName}
            </h2>
            <p
              className="mt-6 text-base leading-8 text-[#333333] dark:text-[#c4c7c5]"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(company.description),
              }}
            />

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={`${homePath}#trip-search`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#006838] px-5 py-3 text-base font-semibold text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:focus-visible:outline-white"
              >
                Get a travel quote
              </Link>
              <Link
                href={basePath}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#006838] px-4 py-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:focus-visible:outline-white"
              >
                View all providers
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer agentCode={agentCode} />
    </div>
  )
}
