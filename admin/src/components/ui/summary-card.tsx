import type { ComponentType, ReactNode } from 'react'

/**
 * Summary card pattern (mockup `x-regular-card`): 45px green icon tile,
 * 20px green/sage title, 14px muted description, optional badge at the end,
 * and a body of grouped label/value fields.
 */
export function SummaryCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text-main)]">
      <header className="flex min-h-[87px] items-center gap-3 border-b border-[var(--border)] px-[21px] pb-[19px] pt-[22px]">
        <span
          aria-hidden="true"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-lg bg-[#006838] text-white"
        >
          <Icon className="size-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h3 className="text-[20px] font-semibold leading-6 text-[#006838] dark:text-[#d0e3c8]">
            {title}
          </h3>
          <p className="text-[14px] leading-[17px] text-[#878787] dark:text-[#b2b7b4]">
            {description}
          </p>
        </div>
        {badge && <div className="ms-auto shrink-0">{badge}</div>}
      </header>
      <div className="px-[29px] py-8">{children}</div>
    </section>
  )
}

export function SummaryGroup({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h4 className="mb-4 text-xs font-normal uppercase text-[#b88e28] dark:text-[#e4c27f]">
        {title}
      </h4>
      {children}
    </section>
  )
}

export function SummaryField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[14px] leading-normal text-[#878787] dark:text-[#b2b7b4]">
        {label}
      </dt>
      <dd className="text-[16px] leading-6 [overflow-wrap:anywhere] text-[var(--text-main)]">
        {children}
      </dd>
    </div>
  )
}

export function SummaryCardsSkeleton({ label = 'Loading details' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="space-y-5 motion-safe:animate-pulse"
    >
      <span className="sr-only">{label}…</span>
      {[3, 2, 1, 3, 2].map((rows, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="w-full min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]"
        >
          <div className="flex min-h-[87px] items-center gap-3 border-b border-[var(--border)] px-[21px] pb-[19px] pt-[22px]">
            <div className="size-[45px] shrink-0 rounded-lg bg-[var(--subtle)]" />
            <div className="min-w-0 space-y-2">
              <div className="h-5 w-40 rounded bg-[var(--subtle)]" />
              <div className="h-3 w-56 max-w-full rounded bg-[var(--subtle)]" />
            </div>
          </div>
          <div className="space-y-5 px-[29px] py-8">
            <div className="h-3 w-28 rounded bg-[var(--subtle)]" />
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: rows * 2 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--subtle)]" />
                  <div className="h-5 w-40 max-w-full rounded bg-[var(--subtle)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

