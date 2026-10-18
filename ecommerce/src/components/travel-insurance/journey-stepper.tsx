'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type JourneyStepperProps = {
  steps: ReadonlyArray<{ title: string }>
  currentStep: number
  searchHref?: string
  onStepChange?: (step: number) => void
}

export function JourneyStepper({
  steps,
  currentStep,
  searchHref,
  onStepChange,
}: JourneyStepperProps) {
  const total = steps.length
  const progress = ((currentStep + 1) / total) * 100

  return (
    <nav aria-label="Booking progress">
      <div className="py-3 sm:hidden">
        <p className="text-foreground text-sm font-medium">
          Step {currentStep + 1} of {total} · {steps[currentStep]?.title}
        </p>
        <div
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuetext={`Step ${currentStep + 1} of ${total}: ${steps[currentStep]?.title}`}
          aria-label="Booking progress"
          className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol
        className="hidden py-2.5 sm:grid"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => {
          const isCurrent = index === currentStep
          const isCompleted = index < currentStep
          const isLast = index === total - 1
          const href = index === 0 ? searchHref : undefined
          const clickable = isCompleted && (!!href || !!onStepChange)

          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  (isCompleted || isCurrent) &&
                    'border-primary bg-primary text-primary-foreground',
                  !isCompleted &&
                    !isCurrent &&
                    'border-muted-foreground bg-card text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-sm whitespace-nowrap lg:text-[15px]',
                  isCurrent
                    ? 'text-foreground font-bold'
                    : 'text-muted-foreground font-normal',
                  isCompleted && 'text-foreground',
                  !isCurrent && 'hidden lg:block',
                  clickable && 'group-hover:underline'
                )}
              >
                {step.title}
              </span>
              <span className="sr-only">
                {isCompleted
                  ? ' (completed)'
                  : isCurrent
                    ? ' (current step)'
                    : ' (not started)'}
              </span>
            </>
          )

          const itemClass =
            'group relative z-10 flex flex-col items-center gap-1 rounded-md px-2'
          const focusClass =
            'cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

          return (
            <li
              key={step.title}
              aria-current={isCurrent ? 'step' : undefined}
              className="relative flex justify-center"
            >
              {clickable && href ? (
                <a href={href} className={cn(itemClass, focusClass)}>
                  {content}
                </a>
              ) : clickable ? (
                <button
                  type="button"
                  onClick={() => onStepChange?.(index)}
                  className={cn(itemClass, focusClass)}
                >
                  {content}
                </button>
              ) : (
                <span
                  aria-disabled={isCurrent ? undefined : true}
                  className={cn(itemClass, 'cursor-default')}
                >
                  {content}
                </span>
              )}
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-[13px] left-[calc(50%+24px)] h-0.5 w-[calc(100%-48px)] rounded-full',
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/40'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
