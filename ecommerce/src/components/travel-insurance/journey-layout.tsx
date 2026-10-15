'use client'

import { JourneyHeader } from '@/components/travel-insurance/journey-header'
import { cn } from '@/lib/utils'

type JourneyLayoutProps = React.ComponentProps<typeof JourneyHeader> & {
  children: React.ReactNode
  className?: string
  fill?: boolean
}

export function JourneyLayout({
  children,
  className,
  fill,
  ...headerProps
}: JourneyLayoutProps) {
  return (
    <div className={cn('bg-section relative min-h-screen w-full', !fill && 'lg:min-h-0')}>
      <JourneyHeader {...headerProps} />
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
      <h1 className="text-primary text-[28px] leading-tight font-semibold">
        {title}
      </h1>
      {helper && <p className="text-muted-foreground text-base">{helper}</p>}
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
