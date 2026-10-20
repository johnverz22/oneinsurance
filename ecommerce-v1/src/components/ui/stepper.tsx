'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

interface StepProps {
  title: string
  index: number
  description?: string
  isActive?: boolean
  isVisited?: boolean
  isCompleted?: boolean
  onClick?: () => void
  className?: string
}

const Step: React.FC<StepProps> = ({
  title,
  index,
  description,
  isActive,
  isVisited,
  isCompleted,
  onClick,
  className,
}) => {
  const isMobile = useIsMobile()

  return (
    <div
      tabIndex={1}
      role="button"
      className={cn(
        'border-muted-foreground/10 flex items-center lg:shrink-0 rounded-md px-1 py-1.5 sm:px-2 sm:py-2',
        className
      )}
      // onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2 sm:h-7 sm:w-7 lg:h-8 lg:w-8',
            { 'text-tertiary': isVisited },

            isCompleted
              ? 'from-primary to-lilac text-primary-foreground bg-gradient-to-r'
              : isActive
                ? 'border-primary bg-primary text-white'
                : 'border-foreground/50'
          )}
        >
          {isCompleted ? (
            <Check className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
          ) : (
            <span
              className={cn('text-foreground text-[10px] sm:text-xs', {
                'text-tertiary': isVisited,
                'dark:text-accent font-bold text-white':
                  isActive || isCompleted,
              })}
            >
              {index ?? title[0]}
            </span>
          )}
        </div>
      </div>
      {!isMobile && (
        <div className="ml-2 lg:ml-3">
          <p
            className={cn(
              'text-muted-foreground text-xs font-medium sm:text-sm lg:text-base lg:whitespace-nowrap',
              {
                'text-tertiary': isVisited,
                'text-primary dark:text-accent font-bold':
                  isActive || isCompleted,
              }
            )}
          >
            {title}
          </p>
          {description && (
            <p className="text-muted-foreground text-[10px] sm:text-xs">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

interface StepperProps {
  steps: Array<{ title: string; description?: string }>
  currentStep: number
  highestVisitedStep: number
  orientation?: 'vertical' | 'horizontal'
  contentContainerClass?: string
  withController?: boolean
  onStepChange?: (step: number) => void
}

export function Stepper({
  steps,
  currentStep,
  highestVisitedStep,
  orientation = 'horizontal',
  contentContainerClass,
  withController = false,
  onStepChange,
}: StepperProps) {
  const isMobile = useIsMobile()

  // Mobile: compact progress indicator
  if (isMobile) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-primary text-sm font-bold">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="text-muted-foreground text-xs">
            {steps[currentStep]?.title}
          </p>
        </div>
        <div className="mt-2 flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-sm overflow-x-auto px-2 sm:px-4 md:overflow-hidden lg:max-w-7xl">
      <div
        className={cn(
          'relative mb-4 flex h-full flex-col items-center justify-between gap-2 sm:mb-6',
          {
            'md:flex-row md:items-center':
              orientation === 'horizontal',
          },
          contentContainerClass
        )}
      >
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            <Step
              index={index + 1}
              title={step.title}
              description={step.description}
              isActive={index === currentStep}
              isCompleted={index < highestVisitedStep}
              isVisited={index <= highestVisitedStep}
              onClick={() => {
                if (index <= highestVisitedStep) onStepChange?.(index)
              }}
              className={cn({ 'cursor-pointer': index <= highestVisitedStep })}
            />
            {index < steps.length - 1 && (
              <div className="flex h-full w-full items-center justify-center">
                {orientation === 'horizontal' ? (
                  <div className="bg-foreground h-px w-3 sm:w-4 lg:w-6" />
                ) : (
                  <div className="bg-border ml-3 h-3 w-1 sm:ml-4 sm:h-4 lg:ml-6" />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {withController && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onStepChange?.(currentStep - 1)}
            disabled={currentStep === 0}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <Button
            onClick={() => onStepChange?.(currentStep + 1)}
            disabled={currentStep === steps.length - 1}
            className="w-full sm:w-auto"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  )
}
