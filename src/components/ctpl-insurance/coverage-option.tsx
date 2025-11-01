'use client'

import { Button } from '@/components/ui/button'
import { useForm } from '@tanstack/react-form'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useGetTravelQuote } from '@/app/data/queries/get-travel-quote'
import { InsurancePlans } from '@/components/ctpl-insurance/insurance-plans'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { CoverageOptionSchema } from '@/types/travel-insurance/travel-insurance-request'
import { removeLocalStorage } from '@/utils/remove-session-storage'
import {
  CTPLCompareQuoteResponse,
  CTPLCoverageOptionFormData,
  CTPLCoverageOptionSchema,
  InsurancePlan,
} from '@/types/ctpl-insurance/init-compare'
import { UseQueryResult } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CoverageOptionsFormProps {
  clientRequestId: string
  coverageOption: CTPLCoverageOptionFormData
  increaseStep: () => void
  updateCoverageOption: (data: Partial<CTPLCoverageOptionFormData>) => void
  useGetCompareQuote: (
    clientRequestId: string
  ) => UseQueryResult<CTPLCompareQuoteResponse, Error>
}

export function CTPLCoverageOptionsForm({
  clientRequestId,
  coverageOption,
  increaseStep,
  updateCoverageOption,
  useGetCompareQuote,
}: CoverageOptionsFormProps) {
  const hasHydrated = useCtplInsuranceStateStore.persist?.hasHydrated()

  const router = useRouter()

  if (!clientRequestId) {
    return <div>Loading...</div>
  }

  const {
    data: compareQuote,
    isLoading,
    isError,
  } = useGetCompareQuote(clientRequestId)

  const form = useForm({
    defaultValues: coverageOption,
    onSubmit: async ({ value }) => {
      console.log(compareQuote)
      toast.info('Under Development')
      increaseStep()
    },
    validators: {
      onChange: CTPLCoverageOptionSchema,
    },
  })

  const handleSelectPlan = (plan: InsurancePlan, carrierCode: string) => {
    form.setFieldValue('selectedPlan', plan)
    form.setFieldValue('carrierCode', carrierCode)
    form.setFieldValue('selectedAddonBenefits', [])
    updateCoverageOption({ selectedPlan: plan, carrierCode })
  }

  if (isError) {
    return (
      <div className="relative mx-auto min-h-screen max-w-7xl space-y-4 text-center">
        <div
          className={`flex flex-col items-center justify-center rounded-lg p-8 shadow-sm`}
        >
          {/* Warning Icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Message */}
          <div className="mb-6 text-center">
            <h3 className="mb-2 text-lg font-semibold">Server Timeout</h3>
            <p className="leading-relaxed">
              The server took longer to load than usual
              <br />
              Please refresh the page
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !compareQuote) {
    return (
      <div className="relative mx-auto min-h-screen max-w-7xl space-y-4">
        <Skeleton className="h-16 w-full p-4" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
            <Skeleton className="h-96 w-full" key={index} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto max-w-7xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit(e)
        }}
        className="space-y-6"
      >
        <div className="relative flex h-full min-h-[60vh] flex-wrap gap-3">
          {compareQuote.data.map((quote) => (
            <InsurancePlans
              key={quote.CarrierCode}
              plans={quote.Plans}
              carrierCode={quote.CarrierCode}
              selectedPlan={
                coverageOption.selectedPlan?.CarrierPlanCode ||
                form.getFieldValue('carrierCode')
              }
              onSelectPlan={(plan, carrierCode) =>
                handleSelectPlan(plan, carrierCode)
              }
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            variant={'ghost'}
            onClick={() => {
              removeLocalStorage('travel-insurance-form')
              router.push('/products/travel-insurance')
            }}
          >
            Back
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="rounded-lg px-8 py-3 font-medium text-white lg:min-w-64"
              >
                {isSubmitting ? 'Processing...' : 'Review your selected plan'}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
