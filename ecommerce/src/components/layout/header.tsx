'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useState, useRef, useEffect, useSyncExternalStore } from 'react'

import { PRODUCT_FLAGS } from '@/lib/product-flags'
import { cn } from '@/lib/utils'

export interface ProductConfig {
  name: string
  slug: string
  flagKey: string
}

export const PRODUCTS_CONFIG: ProductConfig[] = [
  { name: 'Travel Insurance', slug: 'travel-insurance', flagKey: 'travel-insurance' },
  { name: 'Health Insurance', slug: 'health-insurance', flagKey: 'health-insurance' },
  { name: 'CTPL Insurance', slug: 'ctpl-insurance', flagKey: 'ctpl-insurance' },
  { name: 'Marine Cargo Insurance', slug: 'marine-cargo-insurance', flagKey: 'marine-cargo-insurance' },
  { name: 'Engineering Insurance', slug: 'engineering-insurance', flagKey: 'engineering-insurance' },
  { name: 'Mandatory and Specialized Insurance Coverage', slug: 'specialized-insurance', flagKey: 'specialized-insurance' },
]

export interface NavMenuItem {
  label: string
  href: string
}

const emptySubscribe = () => () => {}

const JOURNEY_STEPS = [
  { label: 'Trip details', path: '' },
  { label: 'Choose a plan', path: '/plans' },
  { label: 'Generate quote', path: '/quote' },
  { label: 'Review quote', path: '/review' },
  { label: 'Payment', path: '/payment' },
]

function HeaderStepper({
  currentStep,
  basePath,
  className,
  onEditTrip,
}: {
  currentStep: number
  basePath: string
  className?: string
  onEditTrip?: () => void
}) {
  return (
    <nav aria-label="Quote progress" className={className}>
      <ol className="travel-progress__list mx-auto max-w-3xl">
        {JOURNEY_STEPS.map((step, i) => {
          const num = i + 1
          const isCurrent = num === currentStep
          const isComplete = num < currentStep
          const content = (
            <>
              <span className="travel-progress__number" aria-hidden={isComplete ? true : undefined}>
                {isComplete ? '✓' : num}
              </span>
              <span>
                {isComplete && <span className="sr-only">Completed: </span>}
                {step.label}
              </span>
            </>
          )
          return (
            <li
              key={step.label}
              aria-current={isCurrent ? 'step' : undefined}
              className={`travel-progress__step${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
            >
              {isComplete && i === 0 && onEditTrip ? (
                <button type="button" onClick={onEditTrip} aria-haspopup="dialog" className="travel-progress__link">
                  {content}
                </button>
              ) : isComplete ? (
                <Link href={`${basePath}${step.path}`}>{content}</Link>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function CompactStepper({
  currentStep,
  basePath,
  onEditTrip,
}: {
  currentStep: number
  basePath: string
  onEditTrip?: () => void
}) {
  const total = JOURNEY_STEPS.length
  const label = `Step ${currentStep} of ${total}: ${JOURNEY_STEPS[currentStep - 1]?.label}`
  const prev = JOURNEY_STEPS[currentStep - 2]
  const backLabel = `Back to ${prev?.label ?? 'Trip details'}`
  const backClass = 'travel-compact-stepper__back'
  return (
    <nav aria-label={label} className="travel-compact-stepper md:hidden">
      {currentStep === 2 && onEditTrip ? (
        <button type="button" onClick={onEditTrip} aria-haspopup="dialog" aria-label={backLabel} className={backClass}>
          <ChevronLeft aria-hidden className="size-5" />
        </button>
      ) : (
        <Link href={`${basePath}${prev?.path ?? ''}`} aria-label={backLabel} className={backClass}>
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
      )}
      <p className="travel-compact-stepper__title" aria-current="step">
        Step {currentStep} of {total} · {JOURNEY_STEPS[currentStep - 1]?.label}
      </p>
      <ol className="travel-compact-stepper__bar" aria-hidden>
        {JOURNEY_STEPS.map((step, i) => (
          <li
            key={step.label}
            className={i + 1 < currentStep ? 'is-complete' : i + 1 === currentStep ? 'is-current' : undefined}
          />
        ))}
      </ol>
    </nav>
  )
}

// ── Lg Breadcrumb Stepper (≥1024px only) ────────────────────────────────────
// Chevron-separated, single row, vertically centred in the navbar.
// All states share a consistent 22px square marker (6px radius).
//   Completed: accent-green border + check icon; label is secondary text.
//   Current: white-tinted marker number inside the primary-green pill.
//   Upcoming: neutral-border marker number; non-interactive.
// Responsive sub-ranges handled via CSS:
//   ≥1280px  → all labels visible on all states
//   1024–1279px → upcoming collapse to marker-only; completed use short labels
function LgBreadcrumbStepper({
  currentStep,
  basePath,
  onEditTrip,
}: {
  currentStep: number
  basePath: string
  onEditTrip?: () => void
}) {
  return (
    <nav aria-label="Progress" className="travel-lg-stepper">
      <ol className="travel-lg-stepper__list">
        {JOURNEY_STEPS.map((step, i) => {
          const num = i + 1
          const isCurrent = num === currentStep
          const isComplete = num < currentStep

          // Short forms for tight 1024-1279px range (non-current items)
          const shortLabel =
            step.label === 'Generate quote' ? 'Quote' :
            step.label === 'Review quote'   ? 'Review' :
            step.label === 'Choose a plan'  ? 'Plans' :
            step.label === 'Trip details'   ? 'Trip' :
            step.label // 'Payment' stays as-is

          if (isComplete) {
            const isEditTripStep = i === 0 && onEditTrip
            const content = (
              <>
                <span aria-hidden className="travel-lg-stepper__marker travel-lg-stepper__marker--complete">
                  <Check className="travel-lg-stepper__marker-icon" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="travel-lg-stepper__label travel-lg-stepper__label--full">
                  {step.label}
                </span>
                <span className="travel-lg-stepper__label travel-lg-stepper__label--short" aria-hidden>
                  {shortLabel}
                </span>
                <span className="sr-only">Completed</span>
              </>
            )
            return (
              <li
                key={step.label}
                className="travel-lg-stepper__item travel-lg-stepper__item--complete"
              >
                {isEditTripStep ? (
                  <button
                    type="button"
                    onClick={onEditTrip}
                    aria-haspopup="dialog"
                    aria-label={`${step.label} (completed)`}
                    className="travel-lg-stepper__btn"
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    href={`${basePath}${step.path}`}
                    aria-label={`${step.label} (completed)`}
                    className="travel-lg-stepper__btn"
                  >
                    {content}
                  </Link>
                )}
                <ChevronRight aria-hidden className="travel-lg-stepper__chevron" strokeWidth={2} />
              </li>
            )
          }

          if (isCurrent) {
            return (
              <li
                key={step.label}
                aria-current="step"
                className="travel-lg-stepper__item travel-lg-stepper__item--current"
              >
                <span className="travel-lg-stepper__pill">
                  <span aria-hidden className="travel-lg-stepper__marker travel-lg-stepper__marker--current">
                    {num}
                  </span>
                  <span className="travel-lg-stepper__pill-label" aria-hidden>
                    {step.label}
                  </span>
                  <span className="sr-only">
                    Step {num} of {JOURNEY_STEPS.length}: {step.label}, current step
                  </span>
                </span>
                {num < JOURNEY_STEPS.length && (
                  <ChevronRight aria-hidden className="travel-lg-stepper__chevron" strokeWidth={2} />
                )}
              </li>
            )
          }

          // Upcoming (non-interactive, collapses to marker-only at 1024–1279px)
          return (
            <li
              key={step.label}
              aria-disabled="true"
              className="travel-lg-stepper__item travel-lg-stepper__item--upcoming"
            >
              <span
                aria-label={`${step.label} (upcoming)`}
                title={step.label}
                className="travel-lg-stepper__upcoming"
              >
                <span aria-hidden className="travel-lg-stepper__marker travel-lg-stepper__marker--upcoming">
                  {num}
                </span>
                <span className="travel-lg-stepper__label travel-lg-stepper__label--full" aria-hidden>
                  {step.label}
                </span>
                <span className="travel-lg-stepper__label travel-lg-stepper__label--short" aria-hidden>
                  {shortLabel}
                </span>
                <span className="sr-only">Step {num}: {step.label}, upcoming</span>
              </span>
              {num < JOURNEY_STEPS.length && (
                <ChevronRight aria-hidden className="travel-lg-stepper__chevron" strokeWidth={2} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface HeaderProps {
  agentCode?: string
  currentStep?: number
  currentProductSlug?: string
  currentProductName?: string
  customNavItems?: NavMenuItem[]
  productsLabel?: string
  cta?: NavMenuItem
  /** Element id the landing CTA stays hidden until scrolled fully past (e.g. the hero form). */
  ctaRevealPast?: string
  onOpenRetrieveModal?: () => void
  onEditTrip?: () => void
}

export function Header({
  agentCode = 'ckO6uNx2O6',
  currentStep,
  currentProductSlug = 'travel-insurance',
  currentProductName,
  customNavItems,
  productsLabel,
  cta,
  ctaRevealPast,
  onOpenRetrieveModal,
  onEditTrip,
}: HeaderProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const [productsOpen, setProductsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)

  const activeSlug = currentProductSlug || 'travel-insurance'
  const isTravelLanding = activeSlug === 'travel-insurance'

  const activeName =
    productsLabel ||
    currentProductName ||
    PRODUCTS_CONFIG.find((p) => p.slug === activeSlug)?.name ||
    'Travel Insurance'

  const basePath = `/${agentCode}/${activeSlug}`
  const homePath = `/${agentCode}/travel-insurance`
  const isHomePage = pathname === homePath || pathname === `${homePath}/`
  const isLanding = !currentStep || currentStep === 1
  const isTravelJourney = !isLanding && isTravelLanding

  const defaultNavItems: NavMenuItem[] = isTravelLanding
    ? [
        { label: 'Coverage', href: isHomePage ? '#coverage' : `${homePath}#coverage` },
        { label: 'How it works', href: isHomePage ? '#how-it-works' : `${homePath}#how-it-works` },
        { label: 'FAQs', href: isHomePage ? '#faqs' : `${homePath}#faqs` },
      ]
    : [
        { label: 'Travel Insurance', href: homePath },
        { label: 'Become an Agent', href: '/agent-application' },
        { label: 'Contact', href: isHomePage ? '#footer' : `${homePath}#footer` },
      ]

  const rawNavItems = customNavItems || defaultNavItems
  const navItems = rawNavItems.map((item) => {
    if (!isHomePage && item.href.startsWith('#') && item.href !== '#footer') {
      return { ...item, href: `${homePath}${item.href}` }
    }
    return item
  })

  const [isStuck, setIsStuck] = useState(false)
  const [ctaRevealed, setCtaRevealed] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const productsBtnRef = useRef<HTMLButtonElement>(null)

  // Reveal the landing CTA once its anchor (e.g. the hero form) is scrolled past
  useEffect(() => {
    if (!ctaRevealPast) return
    const el = document.getElementById(ctaRevealPast)
    const update = () => {
      setCtaRevealed(el ? el.getBoundingClientRect().bottom <= 0 : true)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ctaRevealPast])

  // Scroll-spy for landing navigation links
  useEffect(() => {
    if (!isLanding || !isTravelLanding) return
    const sectionIds = ['coverage', 'how-it-works', 'faqs']
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [isLanding, isTravelLanding])

  // Focus trap, body scroll lock, and Escape listener for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        return
      }
      if (e.key === 'Tab' && mobileNavRef.current) {
        const focusables = mobileNavRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  // Handle keyboard navigation inside desktop products dropdown
  useEffect(() => {
    if (!productsOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProductsOpen(false)
        productsBtnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [productsOpen])

  // Reset open menus on path change
  useEffect(() => {
    setProductsOpen(false)
    setMobileMenuOpen(false)
    setMobileProductsOpen(false)
  }, [pathname])

  // Track scroll position to apply stuck styling
  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 10)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !mobileNavRef.current?.contains(target)
      ) {
        setProductsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const handleGetQuoteClick = (e: React.MouseEvent) => {
    if (isTravelLanding) {
      const el = document.getElementById('trip-search')
      if (el) {
        e.preventDefault()
        el.scrollIntoView({ behavior: 'smooth' })
        setTimeout(() => {
          const firstField = document.querySelector<HTMLElement>(
            '#trip-search button, #trip-search input'
          )
          firstField?.focus()
        }, 350)
      }
    }
  }


  const stepperBase = `/${agentCode}/${activeSlug}`

  return (
    <>
    <header
      className={`travel-header z-30 border-b border-[#dfe7df] bg-white transition-colors duration-200 dark:border-[#3d4140] dark:bg-[#171919] ${
        isLanding ? 'sticky top-0' : 'relative pt-[env(safe-area-inset-top)] md:sticky md:top-0 md:pt-0'
      } ${isStuck ? 'is-stuck' : ''}`}
    >
      <div className={`travel-header__main-row flex w-full ${isLanding ? 'min-h-20' : 'h-12 sm:min-h-20 lg:h-16 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8'} items-center justify-between gap-3 px-5 sm:gap-5 sm:px-8 lg:px-12`}>
        <Link
          href={homePath}
          aria-label="One Insurance home"
          className="travel-header__brand shrink-0 rounded-sm lg:justify-self-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006838]"
        >
          <Image
            src="/storage/img/logo-oi-light.png"
            alt="One Insurance"
            width={160}
            height={40}
            priority
            className={cn('travel-header__logo-light h-auto dark:hidden', isLanding ? 'w-28 sm:w-40' : 'w-24 sm:w-40 lg:h-8 lg:w-auto')}
          />
          <Image
            src="/storage/img/logo-oi-dark.png"
            alt="One Insurance"
            width={160}
            height={40}
            priority
            className={cn('travel-header__logo-dark hidden h-auto dark:block', isLanding ? 'w-28 sm:w-40' : 'w-24 sm:w-40 lg:h-8 lg:w-auto')}
          />
        </Link>

        {isLanding ? (
          <nav aria-label="Main navigation" className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {navItems.map((item) => {
              const isAnchor = item.href.startsWith('#')
              const sectionKey = item.href.replace(/^.*#/, '')
              const isActive = isAnchor && activeSection === sectionKey
              const cls = cn(
                'inline-flex min-h-11 items-center justify-center rounded-md border border-transparent px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                isStuck
                  ? isActive
                    ? 'text-white underline underline-offset-8 decoration-2 decoration-white font-bold dark:text-[#d0e3c8] dark:decoration-[#d0e3c8]'
                    : 'text-white/90 hover:bg-white/15 hover:text-white dark:text-[#f4f5f2] dark:hover:bg-[#303232]'
                  : isActive
                    ? 'text-[#006838] underline underline-offset-8 decoration-2 font-bold dark:text-[#d0e3c8]'
                    : 'text-[#183d2c] hover:bg-[#f1f2f0] hover:text-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232]',
                isStuck ? 'focus-visible:outline-white' : 'focus-visible:outline-[#006838] dark:focus-visible:outline-white'
              )
              return isAnchor ? (
                <a key={item.href} href={item.href} className={cls}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={cls}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        ) : (
          <LgBreadcrumbStepper
            currentStep={currentStep ?? 1}
            basePath={stepperBase}
            onEditTrip={onEditTrip}
          />
        )}

        <div className="flex items-center gap-2 sm:gap-3 lg:justify-self-end">
          {/* Product Switcher Dropdown */}
          <nav
            aria-label="Insurance products"
            className={isTravelJourney ? 'block' : 'hidden lg:block'}
          >
            <div className="relative" ref={dropdownRef}>
              <button
                ref={productsBtnRef}
                type="button"
                onClick={() => setProductsOpen((prev) => !prev)}
                aria-expanded={productsOpen}
                aria-haspopup="true"
                aria-controls={isTravelJourney ? 'mobile-navigation' : 'products-dropdown'}
                className={cn(
                  'inline-grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                  isStuck
                    ? 'text-white hover:bg-white/15 focus-visible:outline-white dark:text-[#f4f5f2] dark:hover:bg-[#303232]'
                    : 'text-[#183d2c] hover:bg-[#f1f2f0] focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:focus-visible:outline-white'
                )}
              >
                <span
                  className={cn(
                    'truncate font-semibold',
                    isStuck ? 'text-white dark:text-[#d0e3c8]' : 'text-[#006838] dark:text-[#d0e3c8]'
                  )}
                >
                  {activeName}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={cn(
                    'size-4 sm:size-5 shrink-0 transition-transform duration-150',
                    productsOpen ? 'rotate-180' : '',
                    isStuck ? 'text-white dark:text-[#d0e3c8]' : 'text-[#006838] dark:text-[#d0e3c8]'
                  )}
                >
                  <path d="M6 9l6 6l6 -6" />
                </svg>
              </button>

              {/* Desktop Floating Dropdown */}
              {productsOpen && (
                <div
                  id="products-dropdown"
                  className="travel-products-menu absolute top-full right-0 z-40 mt-3 hidden w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-[#dfe7df] bg-white py-2 text-[#183d2c] shadow-xl shadow-black/15 lg:block dark:border-[#3d4140] dark:bg-[#262828] dark:text-[#f4f5f2]"
                >
                  <span
                    aria-hidden="true"
                    className="travel-products-menu__arrow absolute -top-2 right-7 size-4 rotate-45 border-t border-l border-[#dfe7df] bg-white dark:border-[#3d4140] dark:bg-[#262828]"
                  />
                  <ul className="relative">
                    {PRODUCTS_CONFIG.map((prod) => {
                      const isCurrent = prod.slug === activeSlug
                      const isEnabled = PRODUCT_FLAGS[prod.flagKey] ?? false
                      const targetHref = `/${agentCode}/${prod.slug}`

                      return (
                        <li key={prod.slug}>
                          <Link
                            href={targetHref}
                            aria-current={isCurrent ? 'page' : undefined}
                            onClick={() => setProductsOpen(false)}
                            className={`flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm font-semibold leading-6 transition-colors ${
                              isCurrent
                                ? 'bg-[#f1f2f0] text-[#006838] dark:bg-[#303232] dark:text-[#d0e3c8]'
                                : 'hover:bg-[#f1f2f0] dark:hover:bg-[#303232]'
                            }`}
                          >
                            <span>{prod.name}</span>
                            {!isEnabled && (
                              <span className="shrink-0 text-[10px] font-normal text-[#808080] dark:text-[#b2b7b4]">
                                Soon
                              </span>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </nav>

          {/* Primary conversion CTA — visible on SM (compact pill) and MD/LG */}
          {isLanding && (!ctaRevealPast || ctaRevealed) && (
            <Link
              href={cta?.href ?? `${homePath}#trip-search`}
              onClick={cta ? undefined : handleGetQuoteClick}
              className={cn(
                'travel-header__cta inline-flex min-h-10 sm:min-h-11 items-center justify-center rounded-full sm:rounded-md px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 shadow-xs',
                isStuck
                  ? 'bg-white text-[#006838] hover:bg-[#f1f2f0] active:bg-[#dfe7df] focus-visible:outline-white dark:bg-[#006838] dark:text-white dark:hover:bg-[#00552e] dark:focus-visible:outline-white font-bold'
                  : 'bg-[#006838] text-white hover:bg-[#00552e] active:bg-[#004525] focus-visible:outline-[#006838] dark:focus-visible:outline-white'
              )}
            >
              {cta?.label ?? 'Get a quote'}
            </Link>
          )}

          {/* Theme Toggle Button (44x44px minimum) */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                isStuck
                  ? 'text-white hover:bg-white/15 focus-visible:outline-white dark:text-[#f4f5f2] dark:hover:bg-[#303232]'
                  : 'text-[#006838] hover:bg-[#f1f2f0] focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232] dark:focus-visible:outline-white'
              )}
            >
              {resolvedTheme === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 sm:size-6"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 sm:size-6"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008" />
                </svg>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle Button (44x44px minimum) */}
          {!isTravelJourney && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-md lg:hidden focus-visible:outline-2',
                isStuck
                  ? 'text-white hover:bg-white/15 focus-visible:outline-white dark:text-[#f4f5f2] dark:hover:bg-[#303232]'
                  : 'text-[#006838] hover:bg-[#e2eddb]/60 hover:text-[#00552e] focus-visible:outline-[#006838] dark:text-[#f4f5f2] dark:hover:bg-[#303232]'
              )}
            >
              <span aria-hidden className="relative block size-5">
                <span
                  className={`absolute inset-x-0 h-0.5 rounded-full bg-current transition-[top,transform] duration-300 ease-in-out ${
                    mobileMenuOpen ? 'top-[9px] rotate-45' : 'top-[2px] rotate-0'
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-[9px] h-0.5 rounded-full bg-current transition-opacity duration-200 ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute inset-x-0 h-0.5 rounded-full bg-current transition-[top,transform] duration-300 ease-in-out ${
                    mobileMenuOpen ? 'top-[9px] -rotate-45' : 'top-[16px] rotate-0'
                  }`}
                />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Journey Products Drawer (Full width like earlier) */}
      {isTravelJourney && (
        <div
          ref={mobileNavRef}
          className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none lg:hidden ${
            productsOpen
              ? 'visible grid-rows-[1fr] opacity-100'
              : 'invisible grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <nav
              id="mobile-navigation"
              aria-label="Other insurance products"
              aria-hidden={!productsOpen}
              className="border-t border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold">
                {PRODUCTS_CONFIG.map((prod) => {
                  const isCurrent = prod.slug === activeSlug
                  const isEnabled = PRODUCT_FLAGS[prod.flagKey] ?? false
                  const targetHref = `/${agentCode}/${prod.slug}`

                  return (
                    <Link
                      key={prod.slug}
                      href={targetHref}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={() => setProductsOpen(false)}
                      className={`flex min-h-11 items-center justify-between py-2 transition-colors ${
                        isCurrent
                          ? 'font-bold text-[#006838] dark:text-[#d0e3c8]'
                          : 'text-[#183d2c] hover:text-[#006838] dark:text-[#f4f5f2]'
                      }`}
                    >
                      <span>{prod.name}</span>
                      {!isEnabled && (
                        <span className="shrink-0 text-[10px] font-normal text-[#808080] dark:text-[#b2b7b4]">
                          Soon
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Stepper row: md only (768-1023px). At lg+ the breadcrumb stepper is inline above. */}
      {!isLanding && (
        <HeaderStepper
          currentStep={currentStep ?? 1}
          basePath={stepperBase}
          onEditTrip={onEditTrip}
          className="hidden border-t border-[#dfe7df] px-5 py-3 sm:px-8 md:block lg:hidden dark:border-[#3d4140]"
        />
      )}

      {/* Mobile Navigation Drawer */}
      {!isTravelJourney && (
        <div
          ref={mobileNavRef}
          className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none lg:hidden ${
            mobileMenuOpen
              ? 'visible grid-rows-[1fr] opacity-100'
              : 'invisible grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
          <nav
            id="mobile-navigation"
            aria-label="Mobile travel navigation"
            aria-hidden={!mobileMenuOpen}
            className="border-t border-[#dfe7df] px-5 py-4 dark:border-[#3d4140]"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-semibold">
              {/* Products Switcher Mobile */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileProductsOpen((prev) => !prev)}
                  aria-expanded={mobileProductsOpen}
                  className="inline-flex min-h-11 w-full items-center justify-between text-left font-semibold text-[#006838] dark:text-[#f4f5f2]"
                >
                  <span>{activeName}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform duration-150 ${mobileProductsOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6l6 -6" />
                  </svg>
                </button>
                {mobileProductsOpen && (
                  <div className="mt-2 space-y-1 rounded-lg border border-[#dfe7df] bg-white p-2 dark:border-[#3d4140] dark:bg-[#262828]">
                    {PRODUCTS_CONFIG.map((p) => {
                      const isCurrent = p.slug === activeSlug
                      const isEnabled = PRODUCT_FLAGS[p.flagKey] ?? false
                      const targetHref = `/${agentCode}/${p.slug}`

                      return (
                        <Link
                          key={p.slug}
                          href={targetHref}
                          aria-current={isCurrent ? 'page' : undefined}
                          onClick={() => {
                            setMobileProductsOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-sm ${
                            isCurrent
                              ? 'rounded-md bg-[#f1f2f0] font-semibold text-[#006838] dark:bg-[#303232] dark:text-[#d0e3c8]'
                              : 'text-[#333333] hover:bg-[#f1f2f0] dark:text-[#c4c7c5] dark:hover:bg-[#303232]'
                          }`}
                        >
                          <span>{p.name}</span>
                          {!isEnabled && (
                            <span className="text-[10px] text-[#808080] dark:text-[#b2b7b4]">
                              Soon
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Navigation Anchors: 2 columns on MD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const isAnchor = item.href.startsWith('#')
                  const cls = "flex min-h-11 items-center px-2 py-2 text-[#183d2c] hover:text-[#006838] dark:text-[#f4f5f2] rounded-md hover:bg-[#f1f2f0] dark:hover:bg-[#303232]"
                  return isAnchor ? (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cls}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cls}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              {isHomePage && isTravelLanding ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    if (onOpenRetrieveModal) {
                      onOpenRetrieveModal()
                    } else {
                      const modal = document.getElementById('retrieve-modal') as HTMLDialogElement | null
                      modal?.showModal()
                    }
                  }}
                  className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md border border-[#006838] px-4 py-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
                >
                  Retrieve proposal
                </button>
              ) : (
                <Link
                  href={cta?.href ?? `${homePath}#trip-search`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md border border-[#006838] px-4 py-2 text-sm font-semibold text-[#006838] hover:bg-[#f1f2f0] dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232]"
                >
                  {cta?.label ?? (isTravelLanding ? 'Explore Travel Insurance' : 'Get a travel quote')}
                </Link>
              )}
            </div>
          </nav>
          </div>
        </div>
      )}
    </header>
    {!isLanding && (
      <CompactStepper currentStep={currentStep ?? 1} basePath={stepperBase} onEditTrip={onEditTrip} />
    )}
    </>
  )
}
