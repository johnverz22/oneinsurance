import type { Metadata } from 'next'
import Link from 'next/link'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ERROR_PAGES, ERROR_PAGE_CODES } from '@/lib/error-pages'

export const metadata: Metadata = {
  title: 'One Insurance — Error pages',
  robots: { index: false },
}

export default function ErrorPagesIndex() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--canvas)] text-[var(--text-main)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-[#006838] focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        Skip to content
      </a>
      <Header productsLabel="Products" />

      <main id="main" className="flex-1" tabIndex={-1}>
        <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
          <h1 className="text-3xl font-semibold tracking-tight text-[#183d2c] sm:text-4xl dark:text-[#f4f5f2]">
            Error pages
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#333333] dark:text-[#c4c7c5]">
            Preview each approved error state. Unknown codes render the 404 page.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ERROR_PAGE_CODES.map((code) => (
              <li key={code}>
                <Link
                  href={`/errors/${code}`}
                  className="flex min-h-12 items-center gap-3 rounded-md border border-[#dfe7df] px-4 py-3 text-sm font-semibold text-[#183d2c] transition-colors hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-[#006838] dark:border-[#3d4140] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
                >
                  <span className="font-bold text-[#006838] dark:text-[#d0e3c8]">{code}</span>
                  <span>{ERROR_PAGES[code].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  )
}
