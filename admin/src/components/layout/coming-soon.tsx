import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

import { PortalContentHeader } from '@/components/layout/portal-content-header'

/**
 * Placeholder for portal sections that are not implemented yet.
 * Rendered inside the shared portal shell so navigation stays consistent.
 * Mockup: canonical shell, a "Coming soon" card and a return link; no claim
 * of a live workflow.
 */
export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PortalContentHeader title={title} />
      <section className="agent-dashboard__panel mt-8 min-w-0 p-5 sm:p-6">
        <div className="flex min-h-64 flex-col items-center justify-center py-8 text-center sm:min-h-80">
          <span
            className="flex size-14 items-center justify-center rounded-full bg-[#e6f2e8] text-[#006838] dark:bg-[#3d5242] dark:text-[#d0e3c8]"
            aria-hidden="true"
          >
            <Clock className="size-7" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--text-main)] sm:text-3xl">
            Coming soon
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-sub)] sm:text-base">
            This admin page is awaiting final UI and workflow confirmation from
            IFRC.
          </p>
        </div>
      </section>
      <Link
        href="/dashboard"
        className="btn-tertiary mt-5 inline-flex items-center gap-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>
    </>
  )
}
