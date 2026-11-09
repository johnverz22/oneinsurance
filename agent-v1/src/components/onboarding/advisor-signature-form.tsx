'use client'

import { signatureSchema } from '@/types/onboarding'
import { useOnboardingStateStore } from '@/store/onboarding-store'
import { useOnboardingStepStateStore } from '@/store/onboarding-store'
import { useForm } from '@tanstack/react-form'
import { delay } from '@/utils/delay'
import { Label } from '../ui/label'
import { FieldInfo } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight, Loader2Icon } from 'lucide-react'

export default function SignatureForm() {
  const { increaseStep, decreaseStep } = useOnboardingStepStateStore()
  const { setData, signatureImage, printedName } = useOnboardingStateStore()

  const form = useForm({
    defaultValues: {
      signatureImage: signatureImage,
      printedName: printedName || '',
    },
    validators: {
      onChange: signatureSchema,
    },
    onSubmit: async ({ value }) => {
      await delay(3000)
      setData(value)
      increaseStep()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="signatureImage">
        {(field) => (
          <div className="grid w-full items-center gap-3">
            <Label htmlFor={field.name}>Signature</Label>
            <Input
              id={field.name}
              name={field.name}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null
                if (file) {
                  field.handleChange(file)
                }
              }}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="printedName">
        {(field) => (
          <div className="flex w-full flex-col gap-2">
            <Label htmlFor={field.name}>Printed Name</Label>
            <Input
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
              onBlur={field.handleBlur}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Button
          type="button"
          onClick={() => decreaseStep()}
          variant={'secondary'}
        >
          <ChevronLeft />
          Back
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <>
                  Next <ChevronRight />
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
