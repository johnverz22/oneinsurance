'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { JourneyStepper } from '@/components/travel-insurance/journey-stepper'
import { JOURNEY_PARTNER_CAPTION } from '@/constants/travel-journey'

type JourneyHeaderProps = {
  agentCode: string | null | undefined
  steps: ReadonlyArray<{ title: string }>
  currentStep: number
  highestVisitedStep?: number
  onStepChange?: (step: number) => void
  className?: string
  /** Mobile only: header scrolls away, the progress bar becomes sticky (pair with TripStickyBar). */
  stickyProgress?: boolean
}

export function JourneyHeader({
  agentCode,
  steps,
  currentStep,
  onStepChange,
  className,
  stickyProgress,
}: JourneyHeaderProps) {
  return (
    <header
      className={cn(
        'border-border bg-card sticky top-0 z-20 border-b sm:relative sm:z-auto',
        stickyProgress && 'max-sm:contents',
        className
      )}
    >
      <div className={cn(stickyProgress && 'max-sm:bg-card')}>
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <a
            href={`/${agentCode}/products/travel-insurance`}
            className="focus-visible:ring-ring flex items-center rounded-md py-1 outline-none focus-visible:ring-2"
          >
            <Image
              src="/images/logo.png"
              alt="One Insurance"
              width={2172}
              height={724}
              className="h-8 w-auto sm:h-9 lg:h-10"
              priority
            />
          </a>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {JOURNEY_PARTNER_CAPTION}
            </span>
            <Image
              src="/images/IFRC.png"
              alt="IFRC"
              width={1290}
              height={800}
              className="h-8 w-auto sm:h-9 lg:h-10"
              priority
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'border-border border-t',
          stickyProgress &&
            'max-sm:bg-card max-sm:border-border max-sm:sticky max-sm:top-0 max-sm:z-30 max-sm:pt-[env(safe-area-inset-top)] max-sm:border-t-0 max-sm:border-b'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <JourneyStepper
            steps={steps}
            currentStep={currentStep}
            searchHref={`/${agentCode}/products/travel-insurance/plans`}
            onStepChange={onStepChange}
          />
        </div>
      </div>
    </header>
  )
}
