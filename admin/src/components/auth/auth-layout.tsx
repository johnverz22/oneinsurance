'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

/**
 * Authentic OneInsurance Auth Layout matching developers.oneinsurance.shop mockup:
 * - Desktop: 30%/70% grid with left-side sticky brand panel over gold overlay photograph
 *   (/images/mockups/admin-login-consultation-v2.png), right panel with curved bottom-left 58px corner
 * - Mobile: Hero banner with photo overlay & back nav, white/dark bottom card overlapping
 *   by 28px (-mt-7) with 28px rounded top corners.
 * - Live dark/light mode toggle with smooth class switching.
 */
export function AuthLayout({
  children,
  heading = 'Welcome to the Admin Portal',
  subheading = 'Access your administrator workspace.',
}: {
  children: React.ReactNode
  heading?: string
  subheading?: string
}) {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only fixed left-3 top-3 z-50 rounded-md bg-[#006838] px-4 py-3 text-white focus:not-sr-only"
      >
        Skip to sign in
      </a>

      <div className="auth-hero-backdrop relative grid min-h-dvh bg-white font-sans text-[var(--text-main)] antialiased dark:bg-[#1c1e1e] dark:text-[var(--text-main)] lg:grid-cols-[minmax(0,30%)_minmax(0,70%)] lg:bg-[#f1f2f0] lg:dark:bg-[#282c29]">
        {/* Left brand aside (Desktop) */}
        <aside className="relative z-10 hidden min-h-dvh flex-col px-6 py-6 text-white sm:px-10 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-h-0 lg:px-12 lg:py-10">
          <Link
            href="/"
            className="inline-flex w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006838]"
            aria-label="One Insurance home"
          >
            <img
              src="/storage/img/logo-oi-dark.png"
              alt="One Insurance"
              width={160}
              height={41}
              className="h-auto w-37"
            />
          </Link>

          <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10 lg:py-14">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {heading}
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-base leading-7 text-white/85">
                {subheading}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-white/80">One Insurance</p>
          </div>
        </aside>

        {/* Right content panel with curved bottom-left corner */}
        <div className="relative z-10 flex min-h-dvh flex-col bg-[#b88e28] lg:rounded-bl-[58px] lg:bg-[#f1f2f0] lg:px-12 lg:py-10 lg:dark:bg-[#282c29]">
          {/* Mobile hero header */}
          <div className="auth-mobile-hero relative flex h-64 shrink-0 flex-col px-6 pt-6 text-white lg:hidden">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                aria-label="Back to One Insurance home"
                className="inline-flex size-11 items-center justify-center rounded-md text-2xl focus-visible:outline-2 focus-visible:outline-white"
              >
                ‹
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="inline-flex size-11 items-center justify-center rounded-md hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white text-white"
                >
                  <Moon className="size-5 dark:hidden" aria-hidden="true" />
                  <Sun className="size-5 hidden dark:block" aria-hidden="true" />
                </button>
              </div>
            </div>
            <img
              src="/storage/img/logo-oi-dark.png"
              alt="One Insurance"
              width={160}
              height={41}
              className="mx-auto mt-8 h-auto w-40"
            />
          </div>

          {/* Desktop theme toggle */}
          <div className="hidden items-center justify-end lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="inline-flex size-11 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:hover:bg-white/10 text-[var(--text-main)] dark:text-[var(--text-main)]"
            >
              <Moon className="size-5 dark:hidden" aria-hidden="true" />
              <Sun className="size-5 hidden dark:block" aria-hidden="true" />
            </button>
          </div>

          {/* Main Form container */}
          <main
            id="main"
            className="relative mx-auto -mt-7 flex w-full flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-10 pt-9 text-[var(--text-main)] dark:bg-[#282c29] dark:text-[var(--text-main)] sm:px-10 lg:mt-0 lg:max-w-[420px] lg:justify-center lg:rounded-none lg:bg-transparent lg:px-0 lg:py-16 lg:dark:bg-transparent"
          >
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white px-6 pb-6 text-center text-xs leading-5 text-[var(--text-muted)] dark:bg-[#282c29] lg:bg-transparent lg:px-0 lg:pb-0 lg:text-right lg:dark:bg-transparent">
            <p>&copy; {new Date().getFullYear()} One Insurance. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  )
}
