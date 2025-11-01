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
        'border-muted-foreground/10 flex items-center rounded-md px-2 py-2 sm:px-4 sm:py-3.5',
        className
      )}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10 lg:h-12 lg:w-12',
            { 'text-tertiary': isVisited },

            isCompleted
              ? 'border-primary bg-primary text-primary-foreground'
              : isActive
                ? 'border-primary bg-primary text-white'
                : 'border-foreground/50'
          )}
        >
          {isCompleted ? (
            <Check className="h-3 w-3 text-white sm:h-4 sm:w-4" />
          ) : (
            <span
              className={cn('text-foreground text-xs font-medium sm:text-sm', {
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
        <div className="ml-3 lg:ml-4">
          <p
            className={cn(
              'text-muted-foreground text-sm font-medium sm:text-base lg:text-lg',
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
            <p className="text-muted-foreground text-xs sm:text-sm">
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

  return (
    <div className="mx-auto w-full max-w-sm overflow-x-auto px-2 sm:px-4 md:overflow-hidden lg:max-w-7xl">
      <div
        className={cn(
          'relative mb-6 flex h-full flex-col items-center justify-between gap-2 sm:mb-8',
          {
            'md:flex-row md:items-center':
              orientation === 'horizontal' && !isMobile,
            'flex-row items-center': orientation === 'horizontal' && isMobile,
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
              <div className="flex h-full w-full items-center justify-center bg-red-500">
                {orientation === 'horizontal' ? (
                  <div className="bg-foreground h-px w-4 sm:w-6 lg:w-8" />
                ) : (
                  <div className="bg-border ml-4 h-4 w-1 sm:ml-6 sm:h-6 lg:ml-8" />
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
