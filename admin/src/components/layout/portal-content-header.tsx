'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BreadcrumbItem = {
  label: string
  href?: string
}

type PortalContentHeaderProps = {
  /** Page title — rendered on the canvas and scrolls with content */
  title?: React.ReactNode
  /** Subtitle or description — rendered close below the title */
  description?: React.ReactNode
  /** Breadcrumbs — rendered close below the title */
  breadcrumbs?: BreadcrumbItem[]
  /** Action buttons (e.g. status pill on transaction details) */
  actions?: React.ReactNode
  /** When provided, renders a 40px back button with chevron icon before the title */
  backHref?: string
  className?: string
}

/**
 * Page-canvas heading block. The shared top bar (PortalTopBar) owns the
 * theme/notifications controls — this component only renders the page
 * title, description, breadcrumbs and actions, scrolling with the canvas
 * per the platform-shell mockups.
 */
export function PortalContentHeader({
  title,
  description,
  breadcrumbs,
  actions,
  backHref,
  className,
}: PortalContentHeaderProps) {
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0

  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-end justify-between gap-5',
        className
      )}
    >
      <div className="min-w-0">
        {hasBreadcrumbs && (
          <nav aria-label="Breadcrumb" className="mb-2 min-w-0">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)] sm:gap-1.5 sm:text-sm">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1

                return (
                  <li key={idx} className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                    {idx > 0 && (
                      <ChevronRight
                        className="size-3 shrink-0 text-[var(--text-muted)] sm:size-3.5"
                        aria-hidden="true"
                      />
                    )}
                    {isLast || !crumb.href ? (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        className="truncate font-semibold text-[var(--text-main)]"
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="truncate transition-colors hover:text-[#006838] hover:underline dark:hover:text-[#d0e3c8]"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Back"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--text-sub)] transition-colors hover:border-[#006838] hover:bg-[#eff6ef] hover:text-[#006838] focus-visible:outline-2 focus-visible:outline-[#006838] dark:bg-[var(--card)] dark:text-[#d0e3c8] dark:hover:border-[#006838] dark:hover:bg-[#38483b]"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Link>
          )}

          {title && (
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[var(--text-main)] sm:text-3xl">
              {title}
            </h1>
          )}
        </div>

        {description && (
          <p className="mt-2 text-sm leading-6 text-[var(--text-sub)] sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
