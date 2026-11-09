'use client'

import React from 'react'
import {
  CommissionPayementReference,
  commissionPaymentReferenceSchema,
} from '@/types/onboarding'
import { useOnboardingStateStore } from '@/store/onboarding-store'
import { useOnboardingStepStateStore } from '@/store/onboarding-store'
import { useForm } from '@tanstack/react-form'
import { delay } from '@/utils/delay'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { FieldInfo } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ChevronLeft, ChevronRight, Loader2Icon } from 'lucide-react'

export default function CommissionPaymentReferenceForm() {
  const [isOthersSelected, setIsOthersSelected] = React.useState(false)
  const {
    setData,
    paymentMethod,
    otherPaymentMethod,
    accountName,
    accountNumber,
    branch,
    signatureImage: signature,
  } = useOnboardingStateStore()
  const { increaseStep, decreaseStep } = useOnboardingStepStateStore()

  const form = useForm({
    defaultValues: {
      paymentMethod: paymentMethod || '',
      otherPaymentMethod: otherPaymentMethod,
      accountName: accountName || '',
      accountNumber: accountNumber || '',
      branch: branch || '',
      signatureImage: signature || null,
    } as CommissionPayementReference,
    validators: {
      onChange: commissionPaymentReferenceSchema,
    },
    onSubmit: async ({ value }) => {
      await delay(3000)
      // TODO: transform the payment method input
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
    >
      <div className="mb-5 grid gap-5 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <form.Field name="paymentMethod">
            {(field) => (
              <div className="flex flex-col gap-2">
                <p>Payment Method</p>
                <div className="flex flex-col gap-2">
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value)
                      setIsOthersSelected(value === 'others')
                    }}
                  >
                    <div className="flex gap-2">
                      <RadioGroupItem value="Check" id="check" />
                      <Label htmlFor="check">Check</Label>
                    </div>

                    <Label>Bank Transfer to:</Label>
                    <div className="flex gap-2 pl-4">
                      <RadioGroupItem value="BDO (Peso Account)" id="bdo" />
                      <Label htmlFor="bdo">BDO (Peso Account)</Label>
                    </div>
                    <div className="flex gap-2 pl-4">
                      <RadioGroupItem
                        value="China Bank (Peso Account)"
                        id="chinaBank"
                      />
                      <Label htmlFor="chinaBank">
                        China Bank (Peso Account)
                      </Label>
                    </div>
                    <div className="flex gap-2 pl-4">
                      <RadioGroupItem
                        value="Metrobank (Peso Account)"
                        id="metrobank"
                      />
                      <Label htmlFor="metrobank">
                        Metrobank (Peso Account)
                      </Label>
                    </div>
                    <div className="flex gap-2 pl-4">
                      <RadioGroupItem
                        value="Union Bank (Peso Account)"
                        id="unionBank"
                      />
                      <Label htmlFor="unionBank">
                        Union Bank (Peso Account)
                      </Label>
                    </div>
                    <div className="flex gap-2 pl-4">
                      <RadioGroupItem value="others" id="others" />
                      <Label htmlFor="others">Others</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </form.Field>

          {isOthersSelected && (
            <form.Field name="otherPaymentMethod">
              {(field) => {
                return (
                  <>
                    <div className="animate-in slide-in-from-top-2 space-y-2 duration-200">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Please enter the name of the bank"
                        autoFocus
                      />
                      <FieldInfo field={field} />
                    </div>
                  </>
                )
              }}
            </form.Field>
          )}
        </div>

        <div className="col-span-2 flex flex-col gap-2">
          <form.Field name="accountName">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name}>Account Name</Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="accountNumber">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name}>Account Number</Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="branch">
            {(field) => (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor={field.name}>Branch</Label>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        </div>
      </div>

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
