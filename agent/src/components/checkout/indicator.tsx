'use client'

import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'
import { useCheckoutStore } from '@/store/checkout-store'
import { STEPS } from './config'

export function ProgressIndicator() {
  const { currentStep } = useCheckoutStore()
  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="mx-auto mb-8 w-full">
      <div className="mb-4">
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex justify-between">
        {STEPS.map((step) => (
          <div key={step.id} className="flex flex-col items-center text-center">
            <div className="mb-2 flex items-center">
              {currentStep > step.id ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : currentStep === step.id ? (
                <Circle className="h-6 w-6 fill-green-600 text-green-600" />
              ) : (
                <Circle className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="text-sm font-medium">{step.title}</div>
            <div className="text-muted-foreground hidden text-xs sm:block">
              {step.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
