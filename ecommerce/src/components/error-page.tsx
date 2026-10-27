import Link from 'next/link'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ERROR_PAGES } from '@/lib/error-pages'

interface ErrorPageProps {
  code: number
  agentCode?: string
}

/**
 * Shared error page template (approved layout from the error-page design
 * handoff). Open centered layout — no card, illustration, or red alarm
 * treatment. Reuses the consumer navbar and footer.
 */
export function ErrorPage({ code, agentCode = 'ckO6uNx2O6' }: ErrorPageProps) {
  const copy = ERROR_PAGES[code] ?? ERROR_PAGES[500]
  const homePath = `/${agentCode}/travel-insurance`

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--canvas)] text-[var(--text-main)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-[#006838] focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to content
      </a>
      <Header agentCode={agentCode} productsLabel="Products" />

      <main id="main" className="flex-1" tabIndex={-1}>
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-20">
          <p className="text-[clamp(6rem,16vw,10rem)] leading-none font-semibold tracking-tight text-[#006838] dark:text-[#d0e3c8]">
            {copy.code}
          </p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[#183d2c] sm:text-4xl dark:text-[#f4f5f2]">
            {copy.heading}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#333333] dark:text-[#c4c7c5]">
            {copy.description}
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
            <Link href={homePath} className="btn-primary">
              Back to home
            </Link>
            <a href="#error-support" className="btn-secondary">
              Get in touch
            </a>
          </div>
          <p
            id="error-support"
            className="mt-8 text-sm leading-relaxed text-[#808080] dark:text-[#b2b7b4]"
          >
            Need a hand?{' '}
            <a
              href="mailto:sales@ifrcinsurance.com"
              className="inline-flex min-h-8 items-center rounded-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:hover:text-white dark:focus-visible:outline-white"
            >
              Our team is here to help.
            </a>
          </p>
        </div>
      </main>

      <Footer agentCode={agentCode} />
    </div>
  )
}
