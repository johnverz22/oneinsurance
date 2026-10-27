'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ArrowUp, Phone, Mail, MapPin } from 'lucide-react'

interface FooterProps {
  agentCode?: string
}

export function Footer({ agentCode = 'ckO6uNx2O6' }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id="footer" className="border-t border-[#dfe7df] bg-white p-3 dark:border-[#3d4140] dark:bg-[#171919] sm:p-5">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-6 sm:px-10 lg:px-12 lg:pt-12 text-[#183d2c] dark:text-[#f4f5f2]">
        {/* Main 3-column / 2-column Grid */}
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.1fr] xl:gap-16">
          {/* Column 1: Brand & Agent */}
          <div className="flex flex-col">
            <Link
              href={`/${agentCode}/travel-insurance`}
              aria-label="One Insurance home"
              className="inline-block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006838] dark:focus-visible:outline-white"
            >
              <Image
                src="/storage/img/logo-oi-light.png"
                alt="One Insurance"
                width={176}
                height={44}
                className="h-auto w-44 dark:hidden"
              />
              <Image
                src="/storage/img/logo-oi-dark.png"
                alt="One Insurance"
                width={176}
                height={44}
                className="hidden h-auto w-44 dark:block"
              />
            </Link>
            <p className="mt-5 max-w-xs text-xl font-semibold leading-snug text-[#183d2c] dark:text-[#f4f5f2]">
              Clear choices.
              <br />
              Cover for what matters.
            </p>
            <p className="mt-3 text-sm leading-snug text-[#333333] dark:text-[#c4c7c5]">
              A brand of{' '}
              <span className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                IFRC Insurance
              </span>
              .
            </p>
            <div className="mt-6">
              <Link
                href="/agent-application#application"
                className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-[#006838] px-5 py-2.5 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:focus-visible:outline-white transition"
              >
                <span>Become an agent</span>
                <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
              <p className="mt-2 text-xs font-medium text-[#808080] dark:text-[#b2b7b4]">
                Interested in selling insurance? Join our accredited advisor network.
              </p>
            </div>
          </div>

          {/* Column 2: Explore insurance (2-columns on SM) */}
          <nav aria-label="Insurance products" className="flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
              Explore insurance
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-[#333333] dark:text-[#c4c7c5]">
              <li>
                <Link
                  href={`/${agentCode}/travel-insurance`}
                  className="inline-flex min-h-11 items-center rounded-sm py-1 leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
                >
                  Travel Insurance
                </Link>
              </li>
              <li>
                <Link
                  href={`/${agentCode}/health-insurance`}
                  className="inline-flex min-h-11 items-center rounded-sm py-1 leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
                >
                  Health Insurance
                </Link>
              </li>
              <li>
                <Link
                  href={`/${agentCode}/ctpl-insurance`}
                  className="inline-flex min-h-11 items-center rounded-sm py-1 leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
                  title="Compulsory Third Party Liability Insurance"
                >
                  CTPL Insurance (Compulsory Third Party Liability)
                </Link>
              </li>
              <li>
                <Link
                  href={`/${agentCode}/marine-cargo-insurance`}
                  className="inline-flex min-h-11 items-center rounded-sm py-1 leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
                >
                  Marine Cargo Insurance
                </Link>
              </li>
              <li>
                <Link
                  href={`/${agentCode}/engineering-insurance`}
                  className="inline-flex min-h-11 items-center rounded-sm py-1 leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
                >
                  Engineering Insurance (Engineering Lines)
                </Link>
              </li>
              <li>
                <Link
                  href={`/${agentCode}/specialized-insurance`}
                  className="inline-flex min-h-11 items-center rounded-sm py-1 leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
                >
                  Specialized Coverage
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 3: Get in touch & Partners */}
          <div className="flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#006838] dark:text-[#d0e3c8]">
              Get in touch
            </h2>
            <address className="mt-4 space-y-3 text-sm not-italic text-[#333333] dark:text-[#c4c7c5]">
              <div className="flex items-start gap-3">
                <MapPin className="size-5 mt-1 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden="true" />
                <p className="leading-snug break-words [overflow-wrap:anywhere]">
                  <span className="font-semibold text-[#183d2c] dark:text-[#f4f5f2]">
                    IFRC Insurance Head Office
                  </span>
                  <br />
                  <span className="inline-block mt-0.5">
                    6/F Padilla Bldg, 1605 F. Ortigas Jr. Rd,
                    <br />
                    Ortigas Center, Pasig, Metro Manila
                  </span>
                </p>
              </div>
              <a
                href="tel:+63286335681"
                className="flex min-h-11 items-center gap-3 rounded-sm leading-snug hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
              >
                <Phone className="size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden="true" />
                <span>(02) 8633 5681</span>
              </a>
              <a
                href="mailto:sales@ifrcinsurance.com"
                className="flex min-h-11 items-center gap-3 rounded-sm leading-snug break-words [overflow-wrap:anywhere] hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#006838] dark:hover:text-white dark:focus-visible:outline-white"
              >
                <Mail className="size-5 shrink-0 text-[#006838] dark:text-[#d0e3c8]" aria-hidden="true" />
                <span>sales@ifrcinsurance.com</span>
              </a>
            </address>

            <Link
              href={`/${agentCode}/providers`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-[#333333] hover:text-[#006838] hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:text-[#c4c7c5] dark:hover:text-white dark:focus-visible:outline-white"
            >
              <span>Our providers</span>
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Bottom Legal Links & Copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#dfe7df] pt-5 pb-[env(safe-area-inset-bottom)] text-xs text-[#808080] dark:border-[#3d4140] dark:text-[#b2b7b4] sm:flex-row">
          <p className="leading-snug text-center sm:text-left">© 2026 One Insurance · A brand of IFRC Insurance.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
            <Link
              href="/travel-insurance-terms"
              className="inline-flex min-h-8 items-center leading-snug hover:text-[#006838] hover:underline underline-offset-2 dark:hover:text-white"
            >
              Terms & Conditions
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/privacy"
              className="inline-flex min-h-8 items-center leading-snug hover:text-[#006838] hover:underline underline-offset-2 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/data-privacy"
              className="inline-flex min-h-8 items-center leading-snug hover:text-[#006838] hover:underline underline-offset-2 dark:hover:text-white"
            >
              Data Privacy Notice
            </Link>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top of page"
              className="inline-flex min-h-8 items-center gap-1 leading-snug hover:text-[#006838] hover:underline underline-offset-2 dark:hover:text-white"
            >
              <span>Back to top</span>
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
