import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mx-auto mb-8 w-full max-w-6xl">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all ${
                  index < currentStep
                    ? 'bg-green-600 text-white'
                    : index === currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${index <= currentStep ? 'text-green-600' : 'text-gray-500'}`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 flex-1 transition-all ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
