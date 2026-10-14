import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldInfo } from '@/components/ui/form'
import { format } from 'date-fns'
import { ctplDurationSchema, CtplDuration } from '@/types/ctpl-insurance'
import { useCtplInsuranceStateStore } from '@/store/ctpl-store'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)

  // Handle cases where the target month has fewer days than the original date
  if (d.getDate() < day) {
    d.setDate(0)
  }
  return d
}

export default function CTPLPeriodForm() {
  const router = useRouter()
  const { setDuration, duration } = useCtplInsuranceStateStore()
  const [expiryDate, setExpiryDate] = useState<Date>()

  const form = useForm({
    defaultValues: {
      duration: duration.duration || undefined,
      effectiveDate: duration.effectiveDate || undefined,
      expiryDate: duration.expiryDate || undefined,
    },
    validators: {
      onSubmit: ctplDurationSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
      if (expiryDate) {
        setDuration(value)
        router.push('/products/motor-insurance/avail')
      } else {
        // handle error or show message if expiryDate is not set
        alert('Please enter a valid duration to calculate expiry date.')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="w-full space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold md:text-lg">
          How Long Is Your Coverage?
        </h3>
        <p className="text-xs font-light text-muted-foreground md:text-base dark:text-muted-foreground">
          Select the period that best fits your driving needs and keeps your
          vehicle protected.
        </p>
      </div>

      <div className="space-y-6">
        <form.Field name="duration">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="mb-4 block font-semibold">
                Enter insurance duration
              </Label>
              <Select
                value={field.state.value?.toString()}
                onValueChange={(value) => {
                  const durationValue = parseInt(value) as 1 | 3
                  field.handleChange(durationValue)

                  // Calculate and set effective and expiry dates
                  const effectiveDate = new Date()
                  const calculatedExpiryDate = addMonths(
                    effectiveDate,
                    durationValue * 12
                  )

                  setExpiryDate(calculatedExpiryDate)

                  // Update the form with calculated dates
                  form.setFieldValue('effectiveDate', effectiveDate)
                  form.setFieldValue('expiryDate', calculatedExpiryDate)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'1'}>1 Year</SelectItem>
                  <SelectItem value={'3'}>3 Years</SelectItem>
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 lg:flex-row">
        {expiryDate ? (
          <div className="flex w-full items-center justify-between rounded-md border border-success bg-success/30 px-3 py-2 text-sm font-light">
            <p className="text-sm font-light">
              Insurance will expire on {format(expiryDate, 'MMMM dd, yyyy')}
            </p>
            <CheckCircle className="!text-xs" size={16} />
          </div>
        ) : (
          <div />
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size="lg"
              className="self-end px-12 text-white"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Continue'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
