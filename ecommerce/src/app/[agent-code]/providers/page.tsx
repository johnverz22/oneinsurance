import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import { ArrowUpRight } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { COMPANIES } from '@/constants/companies'

export const metadata: Metadata = {
  title: 'One Insurance — Our Providers',
  description:
    'Meet the licensed insurers and healthcare providers behind One Insurance products.',
}

interface PageProps {
  params: Promise<{ 'agent-code': string }>
}

export default async function ProvidersPage({ params }: PageProps) {
  const { 'agent-code': agentCode } = await params
  const homePath = `/${agentCode}/travel-insurance`
  const basePath = `/${agentCode}/providers`

  const navItems = [
    { label: 'Travel Insurance', href: homePath },
    { label: 'Become an Agent', href: '/agent-application' },
    { label: 'Contact', href: '#footer' },
  ]

  return (
    <div className="min-h-screen bg-[var(--canvas)] font-sans text-base text-[var(--text-main)] antialiased">
      <a
        href="#main"
        className="sr-only fixed top-3 left-3 z-50 rounded-md bg-[var(--primary)] px-4 py-3 text-white focus:not-sr-only"
      >
        Skip to content
      </a>

      <Header
        agentCode={agentCode}
        currentProductSlug="travel-insurance"
        productsLabel="Products"
        customNavItems={navItems}
      />

      <main id="main">
        {/* Page header */}
        <section
          aria-labelledby="providers-title"
          className="bg-[var(--header)]"
        >
          <div className="mx-auto max-w-7xl px-5 pt-12 pb-10 sm:px-8 lg:pt-16 lg:pb-14">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] dark:text-[#d0e3c8]">
                Our providers
              </p>
              <h1
                id="providers-title"
                className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-main)] sm:text-4xl lg:text-5xl"
              >
                Cover backed by names you can trust.
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--text-sub)]">
                We partner with industry-leading insurers and healthcare
                providers so every plan comes with dependable protection and
                responsive claims support.
              </p>
            </div>

            {/* Logo strip */}
            <ul
              aria-label="Provider logos"
              className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-4"
            >
              {COMPANIES.map((company) => (
                <li key={company.id}>
                  <Link
                    href={`${basePath}/${company.id}`}
                    aria-label={company.companyName}
                    className="flex h-20 w-36 items-center justify-center rounded-md border border-[var(--border)] bg-white p-4 grayscale transition hover:border-[var(--primary)] hover:grayscale-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] dark:focus-visible:outline-white"
                  >
                    <span className="relative block h-full w-full">
                      <Image
                        src={company.image}
                        alt=""
                        fill
                        sizes="144px"
                        className="object-contain"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Provider cards */}
        <section
          aria-label="Provider profiles"
          className="bg-[var(--canvas)]"
        >
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {COMPANIES.map((company) => (
                <li key={company.id}>
                  <Link
                    href={`${basePath}/${company.id}`}
                    className="group flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] px-6 py-7 shadow-lg shadow-[#183d2c]/5 transition hover:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] dark:shadow-none dark:hover:border-[#d0e3c8] dark:focus-visible:outline-white"
                  >
                    <span className="flex h-20 items-center justify-center rounded-md bg-white p-3">
                      <span className="relative block h-full w-full">
                        <Image
                          src={company.image}
                          alt={`${company.companyName} logo`}
                          fill
                          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
                          className="object-contain"
                        />
                      </span>
                    </span>
                    <span className="mt-6 flex items-start justify-between gap-3">
                      <span>
                        <span className="block text-lg font-semibold text-[var(--primary)] dark:text-[var(--text-main)]">
                          {company.companyName}
                        </span>
                        {company.tagLine && (
                          <span className="mt-1 block text-xs font-medium text-[var(--text-muted)]">
                            {company.tagLine}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-5 shrink-0 text-[var(--text-muted)] transition group-hover:text-[var(--primary)] dark:group-hover:text-[#d0e3c8]"
                      />
                    </span>
                    <span
                      className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--text-sub)]"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(company.description),
                      }}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="mt-14 text-center">
              <p className="text-base leading-7 text-[var(--text-sub)]">
                Ready to see what these providers can offer your next trip?
              </p>
              <Link
                href={`${homePath}#trip-search`}
                className="btn-primary mt-5 gap-2 px-5 py-3 text-base"
              >
                Get a travel quote
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer agentCode={agentCode} />
    </div>
  )
}
