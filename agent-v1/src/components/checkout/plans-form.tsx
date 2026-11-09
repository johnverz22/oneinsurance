'use client'

import { Check, CircleCheck } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { baseInsuranceSchema } from '@/types/checkout'
import { useCheckoutStore } from '@/store/checkout-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getInsuranceById } from './helpers'

const schema = baseInsuranceSchema.pick({
  planIndex: true,
})

export function PlanForm() {
  const { formData, updateFormData, nextStep, prevStep } = useCheckoutStore()

  const insuranceType = formData.type
  const selectedInsurance = getInsuranceById(formData.insuranceId)!
  const form = useForm({
    defaultValues: {
      planIndex: 0,
    },
    onSubmit: async ({ value }) => {
      updateFormData(value)
      nextStep()
    },
    validators: {
      onChange: schema,
    },
  })

  if (!selectedInsurance) {
    return (
      <Card className="mx-auto w-full max-w-6xl">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Please select an insurance first.
          </p>
          <Button onClick={prevStep} className="mt-4 w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Choose Your {insuranceType} Insurance Plan</CardTitle>
        <p className="text-muted-foreground">
          Select the insurance product and plan that best fits your needs
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-8"
        >
          <form.Field
            name="planIndex"
            children={(field) => (
              <div className="space-y-4">
                <RadioGroup
                  value={String(field.state.value)}
                  onValueChange={(value) => field.handleChange(Number(value))}
                  className="grid gap-4 md:grid-cols-2"
                >
                  {selectedInsurance.plans.map((plan, index) => (
                    <div key={plan.name} className="relative">
                      <RadioGroupItem
                        value={String(index)}
                        id={plan.name}
                        className="peer sr-only"
                      />

                      <Label
                        htmlFor={plan.name}
                        className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]: [&:has([data-state=checked])]: flex h-full w-full cursor-pointer flex-col rounded-lg border-2 p-6"
                      >
                        <div className="w-full">
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-lg font-semibold">
                              {plan.name}
                            </h4>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                ₱{plan.price.toLocaleString()}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                per year
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="mb-2">
                              Max Benefit: {plan.mbl}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h5 className="mb-2 text-sm font-medium">
                                Coverage Includes:
                              </h5>
                              <ul className="space-y-1">
                                {plan.coverage
                                  .slice(0, 3)
                                  .map((item, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center text-sm"
                                    >
                                      <CircleCheck className="mr-2 h-4 w-4 flex-shrink-0 text-green-600" />
                                      {item}
                                    </li>
                                  ))}
                                {plan.coverage.length > 3 && (
                                  <li className="text-muted-foreground text-sm">
                                    +{plan.coverage.length - 3} more benefits
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div>
                              <h5 className="mb-2 text-sm font-medium">
                                Key Benefits:
                              </h5>
                              <ul className="space-y-1">
                                {plan.benefits
                                  .slice(0, 2)
                                  .map((item, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center text-sm"
                                    >
                                      <CircleCheck className="mr-2 h-4 w-4 flex-shrink-0 text-blue-600" />
                                      {item}
                                    </li>
                                  ))}
                                {plan.benefits.length > 2 && (
                                  <li className="text-muted-foreground text-sm">
                                    +{plan.benefits.length - 2} more benefits
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          />

          <div className="bg-muted/50 space-y-4 rounded-lg p-6">
            <div>
              <h3 className="text-lg font-bold">
                About {selectedInsurance.title}
              </h3>
              <p className="text-sm">{selectedInsurance.more.overview}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-medium">Important Notes:</h4>
                <ul className="space-y-1">
                  {selectedInsurance.more.notes.map((note, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-green-600" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-medium">
                  Frequently Asked Questions:
                </h4>
                <div className="space-y-2">
                  {selectedInsurance.more.faqs.slice(0, 2).map((faq, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex-1 bg-transparent"
            >
              Previous
            </Button>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 text-white"
                >
                  {isSubmitting ? 'Processing...' : 'Continue to Personal Info'}
                </Button>
              )}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
