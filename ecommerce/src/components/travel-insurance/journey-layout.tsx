'use client'

import { JourneyHeader } from '@/components/travel-insurance/journey-header'
import { cn } from '@/lib/utils'

type JourneyLayoutProps = React.ComponentProps<typeof JourneyHeader> & {
  children: React.ReactNode
  className?: string
  /** Forwarded to the journey <header> (e.g. to un-pin it on pages with their own sticky bar). */
  headerClassName?: string
}

export function JourneyLayout({
  children,
  className,
  headerClassName,
  ...headerProps
}: JourneyLayoutProps) {
  return (
    // min-h-screen on every breakpoint — journey pages render no site footer,
    // so a short step (e.g. payment with nothing selected) must still paint
    // the section background to the bottom of the viewport.
    <div className={cn('bg-section relative min-h-screen w-full')}>
      <JourneyHeader {...headerProps} className={headerClassName} />
      <div className={cn('pt-4 pb-28 sm:pt-6 lg:pb-12', className)}>
        {children}
      </div>
    </div>
  )
}

export function PageIntro({
  title,
  helper,
  className,
}: {
  title: string
  helper?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <h1 className="text-primary text-[24px] leading-tight font-semibold text-balance sm:text-[28px]">
        {title}
      </h1>
      {helper && <p className="text-muted-foreground text-sm sm:text-base">{helper}</p>}
    </div>
  )
}

export function JourneyContainer({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mx-auto max-w-7xl px-4 sm:px-6', className)}
      {...props}
    />
  )
}
